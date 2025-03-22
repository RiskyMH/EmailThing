import { db } from '../db';
import { proposeSync } from '../sync-user';
import type { DBEmail, DBMailboxCategory, DBEmailDraft } from '../types';
import Dexie from 'dexie';
import { createId } from '@paralleldrive/cuid2';
import { parseHTML } from '@/app/email-item/parse-html';
import { parse as markedParse } from 'marked';

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
        color?: string | 0;
    }[];
    hasAttachments?: boolean;
}

interface EmailCategoriesListResult {
    categories: {
        id: string;
        name: string;
        color?: string | 0;
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
    // Start with base query using mailboxId+createdAt index
    let emailQuery = (type === 'drafts'
        ? db.draftEmails.where('[mailboxId+createdAt+isDeleted]').between(
            [mailboxId, Dexie.minKey, 0],
            [mailboxId, Dexie.maxKey, 0]
        )
        : db.emails.where('[mailboxId+createdAt+deletedAt+isDeleted]').between(
            [mailboxId, Dexie.minKey, 0, 0],
            [mailboxId, Dexie.maxKey, 0, 0]
        )
    ) as ReturnType<typeof db.emails.where>

    // Apply filters based on type
    if (type !== 'drafts') {
        switch (type) {
            case 'sent':
                if (categoryId) {
                    emailQuery = db.emails.where('[mailboxId+categoryId+isSender+binnedAt+tempId+isDeleted+createdAt]')
                        .between(
                            [mailboxId, categoryId, 1, 0, 0, 0, Dexie.minKey],
                            [mailboxId, categoryId, 1, 0, 0, 0, Dexie.maxKey]
                        );
                } else {
                    emailQuery = db.emails
                        .where('[mailboxId+isSender+binnedAt+tempId+isDeleted+createdAt]')
                        .between(
                            [mailboxId, 1, 0, 0, 0, Dexie.minKey],
                            [mailboxId, 1, 0, 0, 0, Dexie.maxKey]
                        );
                }
                break;
            case 'trash':
                if (categoryId) {
                    emailQuery = db.emails.where('[mailboxId+categoryId+binnedAt+tempId+isDeleted+createdAt]')
                        .between(
                            [mailboxId, categoryId, 1, 0, 0, Dexie.minKey],
                            [mailboxId, categoryId, Dexie.maxKey, 0, 0, Dexie.maxKey]
                        );
                } else {
                    emailQuery = db.emails
                        .where('[mailboxId+binnedAt+tempId+isDeleted+createdAt]')
                        .between(
                            [mailboxId, 1, 0, 0, Dexie.minKey],
                            [mailboxId, Dexie.maxKey, 0, 0, Dexie.maxKey]
                        )
                }
                break;
            case 'starred':
                if (categoryId) {
                    emailQuery = db.emails.where('[mailboxId+categoryId+isStarred+isSender+binnedAt+tempId+isDeleted+createdAt]')
                        .between(
                            [mailboxId, categoryId, 1, 0, 0, 0, 0, Dexie.minKey],
                            [mailboxId, categoryId, 1, 0, 0, 0, 0, Dexie.maxKey]
                        );
                } else {
                    emailQuery = db.emails
                        .where('[mailboxId+isStarred+isSender+binnedAt+tempId+isDeleted+createdAt]')
                        .between(
                            [mailboxId, 1, 0, 0, 0, 0, Dexie.minKey],
                            [mailboxId, 1, 0, 0, 0, 0, Dexie.maxKey]
                        );
                }
                break;
            case 'temp':
                if (categoryId) {
                    emailQuery = db.emails.where('[mailboxId+categoryId+tempId+isSender+binnedAt+isDeleted+createdAt]')
                        .between(
                            [mailboxId, categoryId, 1, 0, 0, 0, Dexie.minKey],
                            [mailboxId, categoryId, Dexie.maxKey, 0, 0, 0, Dexie.maxKey]
                        );
                } else {
                    emailQuery = db.emails
                        .where('[mailboxId+tempId+isSender+binnedAt+isDeleted+createdAt]')
                        .between(
                            [mailboxId, 1, 0, 0, Dexie.minKey],
                            [mailboxId, Dexie.maxKey, 0, 0, Dexie.maxKey]
                        );
                }
                break;
            case 'inbox':
            default:
                if (categoryId) {
                    emailQuery = db.emails.where('[mailboxId+categoryId+isSender+binnedAt+tempId+isDeleted+createdAt]')
                        .between(
                            [mailboxId, categoryId, 0, 0, 0, 0, Dexie.minKey],
                            [mailboxId, categoryId, 0, 0, 0, 0, Dexie.maxKey]
                        );
                } else {
                    emailQuery = db.emails.where('[mailboxId+isSender+binnedAt+tempId+isDeleted+createdAt]')
                        .between(
                            [mailboxId, 0, 0, 0, 0, Dexie.minKey],
                            [mailboxId, 0, 0, 0, 0, Dexie.maxKey]
                        );
                }
                break;
        }
    }


    // Apply search filter if specified
    if (search) {
        const searchLower = search.toLowerCase();
        if (type === 'drafts') {
            emailQuery = (emailQuery as any as ReturnType<typeof db.draftEmails.where>).filter(item => {
                const searchableFields = [
                    item.subject,
                    item.body,
                ].filter(Boolean);

                return searchableFields.some(field =>
                    (field || "")?.toLowerCase().includes(searchLower)
                );
            }) as any as ReturnType<typeof db.emails.where>;
        } else {
            emailQuery = emailQuery.filter(item => {
                const searchableFields = [
                    item.subject,
                    item.body,
                    item.snippet,
                ].filter(Boolean);

                return searchableFields.some(field =>
                    (field || "")?.toLowerCase().includes(searchLower)
                );
            });
        }
    }

    // Apply pagination
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
            .and(item => item.isDeleted !== 1)
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

            const [sender, recipients, attachments] = await Promise.all([
                db.emailSenders
                    .where('emailId')
                    .equals(email.id)
                    .first(),
                db.emailRecipients
                    .where('emailId')
                    .equals(email.id)
                    .toArray(),
                db.emailAttachments
                    .where('emailId')
                    .equals(email.id)
                    .first()
            ]);

            return {
                ...email,
                from: sender || {
                    name: "Unknown",
                    address: "unknown@emailthing.com"
                },
                to: recipients || [],
                hasAttachments: attachments ? true : false
            };
        })
    );

    return {
        emails: emailsWithDetails,
        categories,
    };
}

export async function getEmailCategoriesList({
    mailboxId,
    type,
    search,
}: EmailListOptions): Promise<EmailCategoriesListResult> {
    // Start with base query using mailboxId index
    let emailQuery = (type === 'drafts'
        ? db.draftEmails.where("[mailboxId+isDeleted]").equals([mailboxId, 0])
        : db.emails.where("[mailboxId+isDeleted]").equals([mailboxId, 0])
    ) as ReturnType<typeof db.emails.where>

    // Apply filters based on type
    if (type !== 'drafts') {
        switch (type) {
            case 'sent':
                emailQuery = db.emails
                    .where('[mailboxId+isSender+binnedAt+tempId+isDeleted]')
                    .equals([mailboxId, 1, 0, 0, 0]);
                break;
            case 'trash':
                emailQuery = db.emails
                    .where('[mailboxId+binnedAt+tempId+isDeleted]')
                    .between([mailboxId, 1, 0, 0], [mailboxId, Dexie.maxKey, 0, 0])
                break;
            case 'starred':
                emailQuery = db.emails
                    .where('[mailboxId+isStarred+isSender+binnedAt+tempId+isDeleted]')
                    .equals([mailboxId, 1, 0, 0, 0, 0]);
                break;
            case 'temp':
                emailQuery = db.emails
                    .where('[mailboxId+tempId+isSender+binnedAt+tempId+isDeleted]')
                    .between([mailboxId, 1, 0, 0, 1, 0], [mailboxId, 1, 0, 0, Dexie.maxKey, 0]);
                break;
            case 'inbox':
            default:
                emailQuery = db.emails
                    .where('[mailboxId+isSender+binnedAt+tempId+isDeleted]')
                    .equals([mailboxId, 0, 0, 0, 0]);
                break;
        }
    }

    // Get total count
    let allCount = 0

    // if search, then we need to get the count of emails that match the search
    if (search) {
        const searchLower = search.toLowerCase();
        const allCount = await emailQuery.filter(item => {
            const searchableFields = [item.subject, item.body, item.snippet].filter(Boolean);
            return searchableFields.some(field =>
                (field || "")?.toLowerCase().includes(searchLower)
            );
        }).count();

        return {
            categories: [],
            allCount,
            mailboxPlan: mailboxId === 'demo' ? { plan: 'DEMO' } : undefined,
        };

    } else {
        allCount = await emailQuery.count();
    }

    // Get categories with counts
    const categories = await db.transaction('r',
        [db.emails, db.mailboxCategories],
        async () => {
            const cats = await db.mailboxCategories
                .where("[mailboxId+isDeleted]")
                .equals([mailboxId, 0])
                .sortBy('createdAt');

            // Can't count categories for drafts
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
                    let categoryQuery = emailQuery.clone();

                    switch (type) {
                        case 'sent':
                            categoryQuery = db.emails
                                .where('[mailboxId+categoryId+isSender+binnedAt+tempId+isDeleted]')
                                .equals([mailboxId, cat.id, 1, 0, 0, 0]);
                            break;
                        case 'trash':
                            categoryQuery = db.emails
                                .where('[mailboxId+categoryId+binnedAt+isDeleted]')
                                .between([mailboxId, cat.id, 1, 0], [mailboxId, cat.id, Dexie.maxKey, 0]);
                            break;
                        case 'starred':
                            categoryQuery = db.emails
                                .where('[mailboxId+categoryId+isStarred+isSender+binnedAt+isDeleted]')
                                .equals([mailboxId, cat.id, 1, 0, 0, 0]);
                            break;
                        case 'temp':
                            categoryQuery = db.emails
                                .where('[mailboxId+categoryId+tempId+isSender+binnedAt+isDeleted]')
                                .equals([mailboxId, cat.id, 1, 0, 0, 0]);
                            break;
                        case 'inbox':
                        default:
                            categoryQuery = db.emails
                                .where('[mailboxId+categoryId+isSender+binnedAt+tempId+isDeleted]')
                                .equals([mailboxId, cat.id, 0, 0, 0, 0]);
                            break;
                    }

                    const count = await categoryQuery.count();

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
        categories,
        allCount,
        mailboxPlan: mailboxId === 'demo' ? { plan: 'DEMO' } : undefined,
    };
}


export const getEmail = (mailboxId: string, emailId: string) => {
    return db.emails.where("[id+mailboxId]").equals([emailId, mailboxId]).first();
}

// Helper function to get a single email with related data
export async function getEmailWithDetails(mailboxId: string, emailId: string) {
    return db.transaction('r',
        [db.emails, db.emailSenders, db.emailRecipients, db.emailAttachments],
        async () => {
            const email = await db.emails
                .where("[id+mailboxId]")
                .equals([emailId, mailboxId])
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

// Update email properties with optimistic UI updates
export async function updateEmailProperties(
    mailboxId: string,
    emailId: string,
    updates: {
        isStarred?: boolean;
        isRead?: boolean;
        categoryId?: string | null;
        binnedAt?: Date | null;
        hardDelete?: boolean;
    }
) {
    await db.transaction('rw', [db.emails], async () => {
        const email = await db.emails
            .where("[id+mailboxId]")
            .equals([emailId, mailboxId])
            .first();

        if (!email) {
            throw new Error('Email not found');
        }

        if (updates.hardDelete) {
            await db.transaction('rw',
                [db.emails],
                async () => {
                    if (mailboxId === 'demo') {
                        // Permanent delete from trash
                        await Promise.all([
                            db.emails.delete(emailId),
                            db.emailSenders.where('emailId').equals(emailId).delete(),
                            db.emailRecipients.where('emailId').equals(emailId).delete(),
                            db.emailAttachments.where('emailId').equals(emailId).delete()
                        ]);
                    } else {
                        await db.emails
                            .where('id')
                            .equals(emailId)
                            .modify({ isDeleted: 1 });
                        // will properly delete the other tables on api response
                    }
                }
            );
        } else {
            // Update using modify instead of delete/add
            // Update using modify instead of delete/add

            const modify: Partial<DBEmail> = {}
            if (updates.isStarred !== undefined) modify.isStarred = updates.isStarred === true ? 1 : 0
            if (updates.isRead !== undefined) modify.isRead = updates.isRead === true ? 1 : 0
            if (updates.categoryId !== undefined) modify.categoryId = updates.categoryId || 0
            if (updates.binnedAt !== undefined) modify.binnedAt = updates.binnedAt || 0
            await db.emails
                .where('id')
                .equals(emailId)
                .modify(modify);
        }
    });
    if (mailboxId !== 'demo') {
        await proposeSync({
            emails: [{
                id: emailId,
                mailboxId,
                lastUpdated: new Date().toISOString(),
                ...updates
            }],
        }, new Date(localStorage.getItem('last-sync') || 0))
    }
}


export async function getEmailCount(mailboxId: string, type: "unread" | "binned" | "drafts" | "temp" | "") {
    switch (type) {
        case "unread":
            return await db.emails
                .where('[mailboxId+isRead+isSender+binnedAt+tempId+isDeleted]')
                .equals([mailboxId, 0, 0, 0, 0, 0])
                .count();
        case "binned":
            return await db.emails
                .where('[mailboxId+binnedAt+tempId+isDeleted]')
                .between([mailboxId, 1, 0, 0], [mailboxId, Dexie.maxKey, 0, 0])
                .count();
        case "drafts":
            return await db.draftEmails
                .where('[mailboxId+isDeleted]')
                .equals([mailboxId, 0])
                .count();
        case "temp":
            return await db.emails
                .where('[mailboxId+tempId+isSender+binnedAt+tempId+isDeleted]')
                .between([mailboxId, 1, 0, 1, 0], [mailboxId, 1, 0, Dexie.maxKey, 0])
                .count();
        default:
            return 0;
    }
}


// drafts
export async function getDraftEmail(mailboxId: string, draftId: string) {
    return db.draftEmails.where("[id+mailboxId]").equals([draftId, mailboxId]).first();
}

export async function updateDraftEmail(mailboxId: string, draftId: string, updates: Partial<DBEmailDraft>) {
    await db.transaction('rw', [db.draftEmails], () =>
        db.draftEmails.where("[id+mailboxId]").equals([draftId, mailboxId]).modify(updates)
    );

    if (mailboxId !== 'demo') {
        await proposeSync({
            draftEmails: [{
                id: draftId,
                mailboxId,
                lastUpdated: new Date().toISOString(),
                ...updates
            }]
        }, new Date(localStorage.getItem('last-sync') || 0))
    }

}

export async function deleteDraftEmail(mailboxId: string, draftId: string) {
    await db.transaction('rw', [db.draftEmails], () =>
        mailboxId === "demo"
            ? db.draftEmails.where("[id+mailboxId]").equals([draftId, mailboxId]).delete()
            : db.draftEmails.where("[id+mailboxId]").equals([draftId, mailboxId]).modify({ isDeleted: 1 })
    );

    if (mailboxId !== 'demo') {
        await proposeSync({
            draftEmails: [{
                id: draftId,
                mailboxId,
                lastUpdated: new Date().toISOString(),
                hardDelete: true
            }]
        }, new Date(localStorage.getItem('last-sync') || 0))
    }

}

export async function createDraftEmail(mailboxId: string, options?: {
    reply?: string;
    replyAll?: string;
    forward?: string;
    from?: string;
}) {
    const draftId = createId();
    let draftData = {} as DBEmailDraft

    await db.transaction('rw', [db.draftEmails, db.emails, db.emailRecipients, db.emailSenders, db.mailboxAliases], async () => {
        const maybeEmailId = options?.reply || options?.replyAll || options?.forward
        const email = maybeEmailId ? await db.emails.where("[id+mailboxId]").equals([maybeEmailId, mailboxId]).first() : null;

        if (email && maybeEmailId) {
            let subject = email.subject || '';
            let to: { name: string | null; address: string; cc?: 'cc' | 'bcc' | null }[] = [];

            const [recipients, sender, aliases] = await Promise.all([
                db.emailRecipients.where('emailId').equals(email.id).toArray(),
                db.emailSenders.where('emailId').equals(email.id).first(),
                db.mailboxAliases.where('mailboxId').equals(mailboxId).toArray(),
            ])

            const aliasesList = aliases.map((a) => a.alias);
            const defaultAlias = aliases.find((a) => a.alias === options.from)?.alias;
            const yourAlias = recipients.find((r) => aliasesList.includes(r.address))?.address || defaultAlias;

            const replyTo = email.replyTo ? { address: email.replyTo, name: null } : sender;

            if (options.reply) {
                if (!subject?.startsWith("Re: ")) {
                    subject = `Re: ${subject}`;
                }
                if (replyTo?.address) {
                    to = [{ name: replyTo?.name || null, address: replyTo?.address, cc: null }];
                }
            } else if (options.replyAll) {
                if (!subject?.startsWith("Re: ")) {
                    subject = `Re: ${subject}`;
                }
                to = [
                    { name: replyTo?.name || null, address: replyTo?.address || '', cc: null },
                    ...recipients.map(r => ({
                        name: r.name || null,
                        address: r.address || '',
                        cc: r.cc ? "cc" as const : null
                    }))
                ].filter(r => r.address !== yourAlias);
            } else if (options.forward) {
                if (!subject?.startsWith("Fwd: ")) {
                    subject = `Fwd: ${subject}`;
                }
            }

            if (email.isSender == 1 && (options.reply || options.replyAll || options.forward)) {
                to = recipients.map(r => ({
                    name: r.name || null,
                    address: r.address || '',
                    cc: r.cc ? "cc" as const : null
                })).filter(r => r.address !== yourAlias);
            }

            let emailBody = `<p></p>\n<p></p>\n<p>\nOn ${email.createdAt.toLocaleString()}, ${sender?.name ? `${sender.name} &lt;${sender.address}&gt;` : `${sender?.address ?? "*someone@idk.com*"}`} wrote:\n\n> ${email.body.split("\n").join("\n> ")}`;
            if (options.forward) {
                const to = recipients.filter(t => !t.cc).map(t => t.name ? `${t.name} &lt;${t.address}&gt;` : t.address);
                const cc = recipients.filter(t => t.cc).map(t => t.name ? `${t.name} &lt;${t.address}&gt;` : t.address);
                const from = sender?.name ? `<b>${sender.name}</b> &lt;${sender.address}&gt;` : `${sender?.address ?? "*someone@idk.com*"}`;
                emailBody = `<p></p>\n<p></p>\n<p>\n---------- Forwarded message ---------<br>\nFrom: ${from}<br>\nDate: ${email.createdAt.toLocaleString()}<br>\nSubject: ${email.subject}<br>\nTo: ${to.join(", ")}${cc.length > 0 ? `<br>\nCc: ${cc.join(", ")}` : ""}<br>\n</p>\n\n${email.body}`;
            }

            draftData = {
                id: draftId,
                mailboxId,
                from: yourAlias ?? 0,
                body: parseHTML(markedParse(emailBody, { breaks: true, async: false })),
                subject,
                to: to ?? 0,
                headers: email.givenId ? [
                    { key: "In-Reply-To", value: email.givenId },
                    {
                        key: "References",
                        value: [email.givenId, ...(email.givenReferences || [])].join(" ")
                    }
                ] : [],
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: 0
            }

        } else {
            draftData = {
                id: draftId,
                mailboxId,
                from: options?.from || 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                subject: '',
                body: '',
                to: [],
                headers: [],
                isDeleted: 0
            }
        }

        await db.draftEmails.add(draftData);

        return draftId;
    });
    if (mailboxId !== 'demo') {
        // intentionally not awaited
        proposeSync({
            draftEmails: [{
                lastUpdated: new Date().toISOString(),
                ...draftData,
                id: `new:${draftId}`,
                mailboxId,
                from: draftData?.from || '',
                // createdAt: new Date(),
                // updatedAt: new Date(),
                subject: draftData?.subject || '',
                body: draftData?.body || '',
                to: draftData?.to || [],
                headers: draftData?.headers || [],
                isDeleted: false,

            }]
        }, new Date(localStorage.getItem('last-sync') || 0))
    }

    return draftId;
}
