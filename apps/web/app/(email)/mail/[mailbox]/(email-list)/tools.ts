import { DraftEmail, Email, EmailSender, TempAlias, db } from "@/db";
import { and, bindIfParam, count, desc, eq, gt, isNotNull, isNull, like, sql } from "drizzle-orm";

export interface EmailListFindOptions {
    isBinned?: boolean;
    isSender?: boolean;
    categoryId?: string;
    isStarred?: boolean;
    take?: number;
    search?: string;
    selectCategories?: boolean;
    isTemp?: boolean;
}
type Curser = { emailId: string; createdAt: Date } | { offset: number };

export async function getJustEmailsList(mailboxId: string, options: EmailListFindOptions = {}, curser?: Curser) {
    const emailsQuery = await db
        .select({
            id: Email.id,
            snippet: Email.snippet,
            subject: Email.subject,
            body: Email.body,
            createdAt: Email.createdAt,
            isRead: Email.isRead,
            isStarred: Email.isStarred,
            binnedAt: Email.binnedAt,
            categoryId: Email.categoryId,
            fromName: EmailSender.name,
            fromAddress: EmailSender.address,
        })
        .from(Email)
        .leftJoin(EmailSender, eq(Email.id, EmailSender.emailId))
        .where(
            and(
                eq(Email.mailboxId, mailboxId),
                options.isBinned ? isNotNull(Email.binnedAt) : isNull(Email.binnedAt),
                // biome-ignore lint/complexity/useSimplifiedLogicExpression: wrong
                options.isBinned ? undefined : eq(Email.isSender, options.isSender || false),
                options.isStarred !== undefined ? eq(Email.isStarred, options.isStarred) : undefined,
                options.isTemp
                    ? and(
                          isNotNull(Email.tempId),
                          options.categoryId ? eq(Email.tempId, options.categoryId) : undefined,
                      )
                    : and(
                          isNull(Email.tempId),
                          options.categoryId ? eq(Email.categoryId, options.categoryId) : undefined,
                      ),
                curser && "emailId" in curser
                    ? sql`(${Email.createdAt}, ${Email.id}) <= (${bindIfParam(curser.createdAt, Email.createdAt)}, ${curser.emailId})`
                    : undefined,
                options.search ? like(Email.subject, `%${options.search}%`) : undefined,
                eq(Email.isDeleted, false),
            ),
        )
        .orderBy(options.isBinned ? desc(Email.binnedAt) : desc(Email.createdAt))
        .limit(options.take ? options.take + 1 : 11)
        .offset(curser && "offset" in curser ? curser.offset : 0)
        .execute();

    return emailsQuery.map((email) => ({
        ...email,
        from: { name: email.fromName, address: email.fromAddress },
    }));
}

export function getEmailList(mailboxId: string, options: EmailListFindOptions = {}, curser?: Curser) {
    return Promise.all([
        getJustEmailsList(mailboxId, options, curser),

        options.selectCategories
            ? db
                  .select({
                      count: count(),
                      categoryId: options.isTemp ? Email.tempId : Email.categoryId,
                  })
                  .from(Email)
                  .where(
                      and(
                          eq(Email.mailboxId, mailboxId),
                          options.isBinned ? isNotNull(Email.binnedAt) : isNull(Email.binnedAt),
                          // biome-ignore lint/complexity/useSimplifiedLogicExpression: wrong
                          options.isBinned ? undefined : eq(Email.isSender, options.isSender || false),
                          options.isStarred !== undefined ? eq(Email.isStarred, options.isStarred) : undefined,
                          options.search ? like(Email.subject, `%${options.search}%`) : undefined,
                          options.isTemp ? isNotNull(Email.tempId) : isNull(Email.tempId),
                          eq(Email.isDeleted, false),
                      ),
                  )
                  .groupBy(options.isTemp ? Email.tempId : Email.categoryId)
            : null,

        db
            .select({ count: count() })
            .from(Email)
            .where(
                and(
                    eq(Email.mailboxId, mailboxId),
                    options.isBinned ? isNotNull(Email.binnedAt) : isNull(Email.binnedAt),
                    // biome-ignore lint/complexity/useSimplifiedLogicExpression: wrong
                    options.isBinned ? undefined : eq(Email.isSender, options.isSender || false),
                    options.isStarred !== undefined ? eq(Email.isStarred, options.isStarred) : undefined,
                    options.search ? like(Email.subject, `%${options.search}%`) : undefined,
                    options.isTemp ? isNotNull(Email.tempId) : isNull(Email.tempId),
                    eq(Email.isDeleted, false),
                ),
            ),
    ]);
}

export async function getDraftJustEmailsList(
    mailboxId: string,
    options?: { take?: number; search?: string },
    curser?: Curser,
) {
    const emails = await db.query.DraftEmail.findMany({
        where: and(
            eq(DraftEmail.mailboxId, mailboxId),
            eq(DraftEmail.isDeleted, false),
            curser && "emailId" in curser
                ? sql`(${DraftEmail.updatedAt}, ${DraftEmail.id}) < (${bindIfParam(curser.createdAt, DraftEmail.updatedAt)}, ${curser.emailId})`
                : undefined,
            options?.search ? like(DraftEmail.subject, `%${options.search}%`) : undefined,
            eq(DraftEmail.isDeleted, false),
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
        offset: curser && "offset" in curser ? curser.offset : undefined,
    });

    const emailsFormatted = emails.map((email) => ({
        ...email,
        snippet: email.body,
        createdAt: email.updatedAt,
        isStarred: null,
        isRead: true,
        from: {
            address: email.from!,
            name: null,
        },
        draft: true,
        binnedAt: null,
        categoryId: null,
    }));

    return emailsFormatted;
}

export async function getDraftEmailList(mailboxId: string, options?: { take?: number; search?: string }) {
    const emails = getDraftJustEmailsList(mailboxId, options);

    const allCount = db
        .select({ count: count() })
        .from(DraftEmail)
        .where(
            and(
                eq(DraftEmail.mailboxId, mailboxId),
                eq(DraftEmail.isDeleted, false),
                options?.search ? like(DraftEmail.subject, `%${options.search}%`) : undefined,
                eq(DraftEmail.isDeleted, false),
            ),
        )
        .execute();

    return Promise.all([emails, null, allCount]);
}

export async function getTempAliases(mailboxId: string) {
    const temps = await db.query.TempAlias.findMany({
        where: and(
            eq(TempAlias.mailboxId, mailboxId),
            gt(TempAlias.expiresAt, new Date()),
            eq(TempAlias.isDeleted, false),
        ),
        columns: {
            id: true,
            alias: true,
            name: true,
            expiresAt: true,
        },
        orderBy: desc(TempAlias.createdAt),
    });

    return temps.map((temp) => ({
        id: temp.id,
        name: temp.name || temp.alias,
        color: "gray",
        expiresAt: temp.expiresAt,
        alias: temp.alias,
    }));
}
