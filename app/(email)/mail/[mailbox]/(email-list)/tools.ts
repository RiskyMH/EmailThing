import { db, DraftEmail, Email } from "@/db";
import { and, bindIfParam, count, desc, eq, isNotNull, isNull, like, lt, sql } from "drizzle-orm";

export interface EmailListFindOptions {
    isBinned?: boolean;
    isSender?: boolean;
    categoryId?: string;
    isStarred?: boolean;
    take?: number;
    search?: string;
    selectCategories?: boolean;
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
            (curser && 'emailId' in curser) ? sql`(${Email.createdAt}, ${Email.id}) < (${bindIfParam(curser.createdAt, Email.createdAt)}, ${curser.emailId})`: undefined,
            options.search ? like(Email.subject, `%${options.search}%`) : undefined
        ),
        columns: {
            id: true,
            snippet: true,
            subject: true,
            body: true,
            createdAt: true,
            isRead: true,
            isStarred: true,
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
    return Promise.all([
        getJustEmailsList(mailboxId, options, curser),

        options.selectCategories ? db
            .select({ count: count(), categoryId: Email.categoryId })
            .from(Email)
            .where(and(
                eq(Email.mailboxId, mailboxId),
                options.isBinned ? isNotNull(Email.binnedAt) : isNull(Email.binnedAt),
                eq(Email.isSender, options.isSender || false),
                options.isStarred !== undefined ? eq(Email.isStarred, options.isStarred) : undefined,
                options.search ? like(Email.subject, `%${options.search}%`) : undefined
            )).groupBy(Email.categoryId) : null,

        db
            .select({ count: count() })
            .from(Email)
            .where(and(
                eq(Email.mailboxId, mailboxId),
                options.isBinned ? isNotNull(Email.binnedAt) : isNull(Email.binnedAt),
                eq(Email.isSender, options.isSender || false),
                options.isStarred !== undefined ? eq(Email.isStarred, options.isStarred) : undefined,
                options.search ? like(Email.subject, `%${options.search}%`) : undefined
            ))

    ])

}

export async function getDraftJustEmailsList(mailboxId: string, options?: { take?: number, search?: string }, curser?: Curser) {
    const emails = await db.query.DraftEmail.findMany({
        where: and(
            eq(DraftEmail.mailboxId, mailboxId),
            (curser && 'emailId' in curser) ? lt((DraftEmail.updatedAt, DraftEmail.id), (curser.createdAt, curser.emailId)) : undefined,
            options?.search ? like(DraftEmail.subject, `%${options.search}%`) : undefined
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

export async function getDraftEmailList(mailboxId: string, options?: { take?: number, search?: string}) {
    const emails = getDraftJustEmailsList(mailboxId, options);

    const allCount = db.select({ count: count() })
        .from(DraftEmail)
        .where(and(
            eq(DraftEmail.mailboxId, mailboxId),
            options?.search ? like(DraftEmail.subject, `%${options.search}%`) : undefined
        ))
        .execute()

    return Promise.all([emails, null, allCount])
}
