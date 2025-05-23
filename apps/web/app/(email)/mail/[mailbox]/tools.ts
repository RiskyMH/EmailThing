import { MailboxAlias, MailboxCategory, MailboxForUser, db } from "@/db";
import { getCurrentUser } from "@/utils/jwt";
import { and, asc, eq, inArray } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

export const userMailboxAccess = cache((mailboxId: string, userId: string | null) => {
    if (!userId) return false;

    return unstable_cache(
        async () => {
            const mailbox = await db.query.MailboxForUser.findFirst({
                where: and(
                    eq(MailboxForUser.mailboxId, mailboxId),
                    eq(MailboxForUser.userId, userId),
                    eq(MailboxForUser.isDeleted, false),
                ),
            });

            return !!mailbox;
        },
        [mailboxId, userId],
        {
            tags: [
                `mailbox-${mailboxId}`,
                `user-${userId}`,
                "user-mailbox-access",
                `user-mailbox-access-${mailboxId}-${userId}`,
            ],
            // revalidate after 7 days
            revalidate: 60 * 60 * 24 * 7,
        },
    )();
});
export const mailboxCategories = cache((mailboxId: string) => {
    return unstable_cache(
        async () => {
            const categories = await db.query.MailboxCategory.findMany({
                where: and(eq(MailboxCategory.mailboxId, mailboxId), eq(MailboxCategory.isDeleted, false)),
                columns: {
                    id: true,
                    name: true,
                    color: true,
                },
                orderBy: asc(MailboxCategory.createdAt),
            });

            return categories;
        },
        [mailboxId],
        {
            tags: [`mailbox-${mailboxId}`, `mailbox-categories-${mailboxId}`],
            // revalidate after 7 days
            revalidate: 60 * 60 * 24 * 7,
        },
    )();
});

export const mailboxAliases = cache((mailboxId: string) => {
    return unstable_cache(
        async () => {
            const aliases = await db.query.MailboxAlias.findMany({
                where: and(eq(MailboxAlias.mailboxId, mailboxId), eq(MailboxAlias.isDeleted, false)),
                columns: {
                    id: true,
                    name: true,
                    default: true,
                    alias: true,
                },
            });

            return {
                aliases,
                default: aliases.find((a) => a.default),
            };
        },
        [mailboxId],
        {
            tags: [`mailbox-${mailboxId}`, `mailbox-aliases-${mailboxId}`],
            // revalidate after 7 days
            revalidate: 60 * 60 * 24 * 7,
        },
    )();
});

export async function pageMailboxAccess(mailboxId?: string | null, throwOnFail = true) {
    if (!mailboxId) return redirect("/login");

    const userId = await getCurrentUser();
    if (!userId) {
        if (!throwOnFail) return false;
        redirect(`/login?from=/mail/${mailboxId}`);
    }

    const userHasAccess = await userMailboxAccess(mailboxId, userId);
    if (!userHasAccess) return throwOnFail ? notFound() : false;

    return userId;
}

export const userMailboxes = cache((userId: string) => {
    return unstable_cache(
        async () => {
            const mailboxes = await db.query.MailboxForUser.findMany({
                where: and(eq(MailboxForUser.userId, userId), eq(MailboxForUser.isDeleted, false)),
                columns: {
                    mailboxId: true,
                    role: true,
                },
                orderBy: asc(MailboxForUser.mailboxId),
            });

            const mailboxesAliases = await db.query.MailboxAlias.findMany({
                where: and(
                    inArray(
                        MailboxAlias.mailboxId,
                        mailboxes.map((m) => m.mailboxId),
                    ),
                    eq(MailboxAlias.default, true),
                    eq(MailboxAlias.isDeleted, false),
                ),
                columns: {
                    mailboxId: true,
                    alias: true,
                },
            });

            return mailboxes.map((m) => ({
                id: m.mailboxId,
                role: m.role,
                name: mailboxesAliases.find((a) => a.mailboxId === m.mailboxId)?.alias || null,
            }));
        },
        [userId],
        {
            tags: [`user-${userId}`, `user-mailboxes-${userId}`],
            // revalidate after 7 days
            revalidate: 60 * 60 * 24 * 7,
        },
    )();
});
