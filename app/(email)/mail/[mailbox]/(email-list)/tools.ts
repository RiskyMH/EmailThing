import { db, DraftEmail, Email } from "@/db";
import { and, count, desc, eq, isNotNull, isNull, lt } from "drizzle-orm";

export interface EmailListFindOptions {
    isBinned?: boolean;
    isSender?: boolean;
    categoryId?: string;
    isStarred?: boolean;
    take?: number;
}
type Curser = { emailId: string, createdAt: Date } | { offset: number }

export function getJustEmailsList(mailboxId: string, options: EmailListFindOptions = {}, curser?: Curser) {
    return db.query.Email.findMany({
        where: and(
            eq(Email.mailboxId, mailboxId),
            options.isBinned ? isNotNull(Email.binnedAt) : isNull(Email.binnedAt),
            eq(Email.isSender, options.isSender || false),
            options.categoryId ? eq(Email.categoryId, options.categoryId) : undefined,
            options.isStarred !== undefined ? eq(Email.isStarred, options.isStarred) : undefined,

            // cursor pagination
            (curser && 'emailId' in curser) ? lt((Email.createdAt, Email.id), (curser.createdAt, curser.emailId)) : undefined,
        ),
        columns: {
            id: true,
            snippet: true,
            subject: true,
            body: true,
            createdAt: true,
            isRead: true,
            isStarred: true,
            raw: true,
            binnedAt: true,
        },
        with: {
            category: {
                columns: {
                    name: true,
                    id: true,
                    color: true
                }
            },
            from: {
                columns: {
                    name: true,
                    address: true
                }
            }
        },
        orderBy: desc(Email.createdAt),
        limit: options.take ? options.take + 1 : 11,
        offset: (curser && 'offset' in curser) ? curser.offset : undefined
    })

}

export function getEmailList(mailboxId: string, options: EmailListFindOptions = {}, curser?: Curser) {
    return db.batch([
        getJustEmailsList(mailboxId, options, curser),

        db
            .select({ count: count(), categoryId: Email.categoryId })
            .from(Email)
            .where(and(
                eq(Email.mailboxId, mailboxId),
                options.isBinned ? isNotNull(Email.binnedAt) : isNull(Email.binnedAt),
                eq(Email.isSender, options.isSender || false),
                options.isStarred !== undefined ? eq(Email.isStarred, options.isStarred) : undefined,
            )).groupBy(Email.categoryId),

        db
            .select({ count: count() })
            .from(Email)
            .where(and(
                eq(Email.mailboxId, mailboxId),
                options.isBinned ? isNotNull(Email.binnedAt) : isNull(Email.binnedAt),
                eq(Email.isSender, options.isSender || false),
                options.isStarred !== undefined ? eq(Email.isStarred, options.isStarred) : undefined,
            ))


    ])

}

export async function getDraftJustEmailsList(mailboxId: string, options?: { take?: number }, curser?: Curser) {
    const emails = await db.query.DraftEmail.findMany({
        where: and(
            eq(DraftEmail.mailboxId, mailboxId),
            (curser && 'emailId' in curser) ? lt((DraftEmail.updatedAt, DraftEmail.id), (curser.createdAt, curser.emailId)) : undefined
        ),
        columns: {
            id: true,
            subject: true,
            body: true,
            updatedAt: true,
            from: true,
        },
        orderBy: desc(DraftEmail.updatedAt),
        limit: options?.take ? options.take + 1 : 11,
        offset: (curser && 'offset' in curser) ? curser.offset : undefined
    })

    const emailsFormatted = emails.map(email => ({
        ...email,
        snippet: email.body,
        createdAt: email.updatedAt,
        isStarred: null,
        isRead: true,
        from: {
            address: email.from!,
            name: null
        },
        draft: true,
        binnedAt: null,
        category: null as any as { name: string, color?: string, id: string } | null
    }))

    return emailsFormatted;
}

export async function getDraftEmailList(mailboxId: string) {
    const emails = getDraftJustEmailsList(mailboxId);

    const allCount = db.select({ count: count() })
        .from(DraftEmail)
        .where(eq(DraftEmail.mailboxId, mailboxId))

    return Promise.all([emails, null, allCount])
}
