import { db } from '../db';
import type { DBEmail, DBMailboxCategory, DBEmailDraft } from '../types';
import Dexie from 'dexie';

export type EmailListType = "inbox" | "sent" | "drafts" | "trash" | "starred" | "temp";

interface BaseEmail {
    id: string;
    mailboxId: string;
    createdAt: Date;
    updatedAt: Date | null;
    subject: string | null;
    body: string;
    html: string | null;
    categoryId?: string | null;
    isRead?: boolean;
    isStarred?: boolean;
    isSender?: boolean;
    binnedAt: Date | null;
    tempId?: string | null;
}

interface EmailWithRecipients extends BaseEmail {
    from: { name: string; address: string };
    to: { name: string | null; address: string; cc?: 'cc' | 'bcc' | null }[];
    cc?: { name: string | null; address: string }[];
    bcc?: { name: string | null; address: string }[];
}

interface EmailListOptions {
    mailboxId: string;
    type: EmailListType;
    categoryId?: string;
    search?: string;
    take?: number;
    skip?: number;
}

interface EmailListResult {
    emails: EmailWithRecipients[];
    categories: {
        id: string;
        name: string;
        color?: string | null;
    }[];
    allCount: number;
}
interface EmailCategoriesListResult {
    categories: {
        id: string;
        name: string;
        color?: string | null;
        count: number;
    }[];
    allCount: number;
    mailboxPlan?: {
        plan: string;
    };
}

export async function getEmailList({
    mailboxId,
    type,
    categoryId,
    search,
    take = 100,
    skip = 0,
}: EmailListOptions): Promise<EmailListResult> {
    // Start with base query
    let emailQuery = (type === 'drafts'
        ? db.draftEmails.where('mailboxId').equals(mailboxId)
        : db.emails.where('mailboxId').equals(mailboxId)
    ) as ReturnType<typeof db.emails.where>

    // Apply filters based on type
    if (type !== 'drafts') {
        switch (type) {
            case 'sent':
                emailQuery = emailQuery
                    .and(item => item.isSender === true && !item.binnedAt);
                break;
            case 'trash':
                emailQuery = emailQuery
                    .and(item => item.binnedAt != null);
                break;
            case 'starred':
                emailQuery = emailQuery
                    .and(item => item.isStarred === true && !item.binnedAt && !item.isSender);
                break;
            case 'temp':
                emailQuery = emailQuery
                    .and(item => item.tempId != null && !item.binnedAt && !item.isSender);
                break;
            case 'inbox':
            default:
                emailQuery = emailQuery
                    .and(item => !item.isSender && !item.binnedAt && !item.tempId);
                break;
        }
    }

    // Apply category filter if specified
    if (categoryId && type !== 'drafts') {
        emailQuery = emailQuery.and(item => item.categoryId === categoryId);
    }

    // Apply search filter if specified
    if (search && type !== 'drafts') {
        const searchLower = search.toLowerCase();
        emailQuery = emailQuery.filter(item => {
            const searchableFields = [
                item.subject,
                item.body,
                item.snippet
            ].filter(Boolean);

            return searchableFields.some(field =>
                field?.toLowerCase().includes(searchLower)
            );
        });
    }

    // Get total count before pagination
    const allCount = await emailQuery.count();

    // Apply pagination and sorting
    const emails = await emailQuery
        .reverse() // Newest first
        .offset(skip)
        .limit(take)
        .toArray();

    // Get categories
    const categories = type === 'drafts' ? [] :
        await db.mailboxCategories
            .where('mailboxId')
            .equals(mailboxId)
            .toArray();

    // Get sender/recipient info for each email
    const emailsWithDetails = await Promise.all(
        emails.map(async (email) => {
            if (type === 'drafts') {
                return {
                    ...email,
                    from: {
                        name: "demo@emailthing.app",
                        address: "demo@emailthing.app"
                    },
                    to: email.to || [],
                    isRead: true,
                };
            }

            const [sender, recipients] = await Promise.all([
                db.emailSenders
                    .where('emailId')
                    .equals(email.id)
                    .first(),
                db.emailRecipients
                    .where('emailId')
                    .equals(email.id)
                    .toArray()
            ]);

            return {
                ...email,
                from: sender || {
                    name: "Unknown",
                    address: "unknown@emailthing.com"
                },
                to: recipients || []
            };
        })
    );

    return {
        emails: emailsWithDetails,
        categories,
        allCount
    };
}

// Helper function to get optimized queries using compound indexes
function getTypeBasedQuery(mailboxId: string, type: EmailListType) {
    switch (type) {
        case 'sent':
            return db.emails
                .where('[mailboxId+isSender+createdAt]')
                .between(
                    [mailboxId, true, Dexie.minKey],
                    [mailboxId, true, Dexie.maxKey]
                )
                .filter(item => !item.binnedAt);

        case 'trash':
            return db.emails
                .where('[mailboxId+binnedAt+createdAt]')
                .above([mailboxId, null]);

        case 'starred':
            return db.emails
                .where('[mailboxId+isStarred+createdAt]')
                .between(
                    [mailboxId, true, Dexie.minKey],
                    [mailboxId, true, Dexie.maxKey]
                )
                .filter(item => !item.binnedAt && !item.isSender);

        case 'temp':
            return db.emails
                .where('[mailboxId+tempId]')
                .above([mailboxId, null])
                .filter(item => !item.binnedAt && !item.isSender);

        case 'inbox':
        default:
            return db.emails
                .where('[mailboxId+isSender+createdAt]')
                .between(
                    [mailboxId, false, Dexie.minKey],
                    [mailboxId, false, Dexie.maxKey]
                )
                .filter(item => !item.binnedAt && !item.tempId);
    }
}

export async function getEmailCategoriesList({
    mailboxId,
    type,
}: EmailListOptions): Promise<EmailCategoriesListResult> {
    // Get total count of all emails for this mailbox based on the query (just excluding category filtering)
    const allCount = type === 'drafts'
        ? await db.draftEmails.where('mailboxId').equals(mailboxId).count()
        : await db.emails.where('mailboxId')
            .equals(mailboxId)
            .filter(email =>
                (type === 'trash' ? !!email.binnedAt : !email.binnedAt) &&
                (type === 'sent' ? email.isSender : !email.isSender) &&
                (type === 'starred' ? email.isStarred : true)
            )
            .count()


    // Get categories with counts based on current query
    const categories = await db.transaction('r',
        [db.emails, db.mailboxCategories],
        async () => {
            const cats = await db.mailboxCategories
                .where('mailboxId')
                .equals(mailboxId)
                .toArray();

            // Can't count categories for drafts since they're in a separate table
            if (type === 'drafts') {
                return cats.map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    color: cat.color || undefined,
                    count: 0
                }));
            }

            const counts = await Promise.all(
                cats.map(async cat => {
                    const count = await db.emails
                        .where('mailboxId')
                        .equals(mailboxId)
                        .filter(email =>
                            email.categoryId === cat.id &&
                            (type === 'trash' ? !!email.binnedAt : !email.binnedAt) &&
                            (type === 'sent' ? email.isSender : !email.isSender) &&
                            (type === 'starred' ? email.isStarred : true)
                        )
                        .count();

                    return {
                        id: cat.id,
                        name: cat.name,
                        color: cat.color || undefined,
                        count
                    };
                })
            );

            return counts;
        }
    );

    return {
        categories: categories,
        allCount,
        mailboxPlan: mailboxId !== 'demo' ? { plan: 'DEMO' } : undefined,
    };
}


export const getEmail = (mailboxId: string, emailId: string) => {
    return db.emails.where('id').equals(emailId).and(item => item.mailboxId === mailboxId).first();
}

// Helper function to get a single email with related data
export async function getEmailWithDetails(mailboxId: string, emailId: string) {
    return db.transaction('r',
        [db.emails, db.emailSenders, db.emailRecipients, db.emailAttachments],
        async () => {
            const email = await db.emails
                .where('id')
                .equals(emailId)
                .and(item => item.mailboxId === mailboxId)
                .first();

            if (!email) return null;

            const [sender, recipients, attachments] = await Promise.all([
                db.emailSenders
                    .where('emailId')
                    .equals(emailId)
                    .first(),
                db.emailRecipients
                    .where('emailId')
                    .equals(emailId)
                    .toArray(),
                db.emailAttachments
                    .where('emailId')
                    .equals(emailId)
                    .toArray()
            ]);

            return {
                ...email,
                sender,
                recipients,
                attachments
            };
        }
    );
}

export async function getCategories(mailboxId: string) {
    return db.mailboxCategories.where('mailboxId').equals(mailboxId).toArray();
}

// Update email properties with optimistic UI updates
export async function updateEmailProperties(
    mailboxId: string,
    emailId: string,
    updates: {
        isStarred?: boolean;
        isRead?: boolean;
        categoryId?: string | null;
        binnedAt?: Date | null;
    }
) {
    if (mailboxId !== 'demo') {
        try {
            await db.transaction('rw', [db.emails], async () => {
                const email = await db.emails
                    .where('id')
                    .equals(emailId)
                    .and(item => item.mailboxId === mailboxId)
                    .first();

                if (!email) {
                    throw new Error('Email not found');
                }

                // Update using modify instead of delete/add
                await db.emails
                    .where('id')
                    .equals(emailId)
                    .modify({
                        ...updates,
                        updatedAt: new Date()
                    });
            });

            return {
                success: true,
                demo: true,
                message: "This is a demo - changes won't actually do anything",
                description: "But you can see how it would work in the real app!"
            };
        } catch (error) {
            console.error('Failed to update email:', error);
            return {
                success: false,
                demo: true,
                message: "Failed to update email",
                description: "There was an error updating the email"
            };
        }
    }

    return {
        success: false,
        demo: true,
        message: "Updates aren't available in demo",
        description: "This would sync with the server in the real app"
    };
}

// Delete email with optimistic UI updates
export async function deleteEmailLocally(mailboxId: string, emailId: string, type: EmailListType) {
    if (mailboxId !== 'demo') {
        try {
            await db.transaction('rw',
                [db.emails, db.emailSenders, db.emailRecipients, db.emailAttachments],
                async () => {
                    const email = await db.emails
                        .where('id')
                        .equals(emailId)
                        .and(item => item.mailboxId === mailboxId)
                        .first();

                    if (!email) {
                        throw new Error('Email not found');
                    }

                    if (type === 'trash') {
                        // Permanent delete from trash
                        await Promise.all([
                            db.emails.delete(emailId),
                            db.emailSenders.where('emailId').equals(emailId).delete(),
                            db.emailRecipients.where('emailId').equals(emailId).delete(),
                            db.emailAttachments.where('emailId').equals(emailId).delete()
                        ]);
                    } else {
                        // Move to trash
                        await db.emails
                            .where('id')
                            .equals(emailId)
                            .modify({ binnedAt: new Date() });
                    }
                }
            );

            return {
                success: true,
                demo: true,
                message: "This is a demo - changes won't actually do anything",
                description: "But you can see how it would work in the real app!"
            };
        } catch (error) {
            console.error('Failed to delete email:', error);
            return {
                success: false,
                demo: true,
                message: "Failed to delete email",
                description: "There was an error deleting the email"
            };
        }
    }

    return {
        success: false,
        demo: true,
        message: "Deletion isn't available in demo",
        description: "This would sync with the server in the real app"
    };
}


export async function getEmailCount(mailboxId: string, type: "unread" | "binned" | "drafts" | "temp" | "") {
    try {
        let query = type === "drafts"
            ? db.draftEmails.where('mailboxId').equals(mailboxId)
            : db.emails.where('mailboxId').equals(mailboxId);

        switch (type) {
            case "unread":
                return await query
                    .and(email => email.isRead === false && !email.isSender && !email.binnedAt && !email.tempId)
                    .count();
            case "binned":
                return await query
                    .and(email => email.binnedAt != null)
                    .count();
            case "drafts":
                return await query.count();
            case "temp":
                return await query
                    .and(email => email.tempId != null && !email.binnedAt)
                    .count();
            default:
                return 0;
        }
    } catch (error) {
        console.error("Failed to get email count:", error);
        return 0;
    }
}


// drafts
export async function getDraftEmail(mailboxId: string, draftId: string) {
    return db.draftEmails.where("mailboxId").equals(mailboxId).and(item => item.id === draftId).first();
}

export async function updateDraftEmail(mailboxId: string, draftId: string, updates: Partial<DBEmailDraft>) {
    return db.transaction('rw', [db.draftEmails], async () => {
        await db.draftEmails.where("mailboxId").equals(mailboxId).and(item => item.id === draftId).modify(updates);
    });
}

export async function deleteDraftEmail(mailboxId: string, draftId: string) {
    return db.transaction('rw', [db.draftEmails], async () => {
        await db.draftEmails.where("mailboxId").equals(mailboxId).and(item => item.id === draftId).delete();
    });
}

export async function createDraftEmail(mailboxId: string) {
    return db.transaction('rw', [db.draftEmails], async () => {
        const randomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        await db.draftEmails.add({
            id: randomId,
            mailboxId,
            createdAt: new Date(),
            updatedAt: new Date(),
            subject: null,
            body: null,
            from: null,
            to: null,
            headers: null
        });
        return randomId;
    });
}