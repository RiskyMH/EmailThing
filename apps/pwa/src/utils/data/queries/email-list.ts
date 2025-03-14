import { db } from '../db';
import type { DBEmail, DBMailboxCategory, DBEmailDraft } from '../types';

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
    tempId?: string;
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
}

interface EmailListResult {
    emails: EmailWithRecipients[];
    categories: {
        id: string;
        name: string;
        color?: string;
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
}: EmailListOptions): Promise<EmailListResult> {
    // Start building the query
    let emailQuery = (type === 'drafts'
        ? db.draftEmails.where('mailboxId').equals(mailboxId)
        : db.emails.where('mailboxId').equals(mailboxId)
    ) as  ReturnType<typeof db.emails.where> 

    // Apply filters based on type
    if (type !== 'drafts') {
        switch (type) {
            case 'sent':
                emailQuery = emailQuery.and(item => item.isSender === true && !item.binnedAt);
                break;
            case 'trash':
                emailQuery = emailQuery.and(item => !!item.binnedAt);
                break;
            case 'starred':
                emailQuery = emailQuery.and(item => item.isStarred === true && !item.binnedAt && !item.isSender);
                break;
            case 'temp':
                emailQuery = emailQuery.and(item => !!item.tempId && !item.binnedAt && !item.isSender);
                break;
            case 'inbox':
            default:
                emailQuery = emailQuery.and(item =>
                    !item.isSender &&
                    !item.binnedAt &&
                    !item.tempId
                );
                break;
        }
    }

    // Apply category filter if specified
    if (categoryId) {
        emailQuery = emailQuery.and(item => item.categoryId === categoryId);
    }

    // Apply search filter if specified
    if (search) {
        const searchLower = search.toLowerCase();
        emailQuery = emailQuery.and(item => {
            const searchableFields = [
                item.subject,
                item.body,
                item.snippet,
                // For drafts, include recipient fields
                ...(type === 'drafts' ? [
                    item.to?.map(r => r.email).join(' '),
                    item.cc?.map(r => r.email).join(' '),
                    item.bcc?.map(r => r.email).join(' ')
                ] : [])
            ];

            return searchableFields.some(field =>
                field?.toLowerCase().includes(searchLower)
            );
        });
    }

    // Get all emails sorted by creation date
    const emails = emailQuery
        .reverse() // Newest first
        .sortBy('createdAt');

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
    const categories = db.transaction('r',
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

    // Get sender/recipient info for each email
    const emailsWithDetails = await Promise.all(
        (await emails).map(async (email) => {
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
            } else {
                // For regular emails, get the sender and recipients
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
                    recipients: recipients || []
                };
            }
        })
    );

    await Promise.all([emailsWithDetails, categories])

    return {
        emails: await emailsWithDetails,
        categories: await categories,
        allCount,
        mailboxPlan: mailboxId === 'demo' ? { plan: 'DEMO' } : undefined
    };
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
    if (mailboxId === 'demo') {
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
    if (mailboxId === 'demo') {
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


export async function getEmailCount(mailboxId: string, type: "unread" | "binned" | "drafts" | "temp") {

    try {
        let query = db.emails.where("mailboxId").equals(mailboxId);

        switch (type) {
            case "unread":
                query = query.filter(email => !email.isRead && !email.isSender && !email.binnedAt && !email.tempId);
                break;
            case "binned": 
                query = query.filter(email => !!email.binnedAt && !email.isSender && !email.tempId);
                break;
            case "drafts":
                query = db.draftEmails.where("mailboxId").equals(mailboxId);
                break;
            case "temp":
                query = query.filter(email => !!email.tempId && !email.isSender && !email.binnedAt);
                break;
        }

        const count = await query.count();
        return count;

    } catch (error) {
        console.error("Failed to get email count:", error);
        return 0;
    }
}
