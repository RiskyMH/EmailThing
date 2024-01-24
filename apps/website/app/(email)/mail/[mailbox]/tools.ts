import { prisma } from "@email/db";
import { unstable_cache } from "next/cache";
import { cache } from "react";


export const userMailboxAccess = cache((mailboxId: string, userId: string | null) => {
    if (!userId) return false;

    return unstable_cache(
        async () => {
            const mailbox = await prisma.mailboxForUser.findUnique({
                where: {
                    mailboxId_userId: {
                        mailboxId,
                        userId
                    }
                }
            })

            return !!mailbox;
        },
        [mailboxId, userId],
        {
            tags: [
                `mailbox-${mailboxId}`,
                `user-${userId}`,
                `userMailboxAccess`,
                `userMailboxAccess-${mailboxId}-${userId}`
            ],
            // revalidate after 7 days
            revalidate: 60 * 60 * 24 * 7,
        }
    )()
})
export const mailboxCategories = cache((mailboxId: string) => {
    return unstable_cache(
        async () => {
            const mailbox = await prisma.mailboxCategory.findMany({
                where: {
                    mailboxId,
                },
                select: {
                    id: true,
                    name: true,
                    color: true,
                }
            })

            return mailbox;
        },
        [mailboxId],
        {
            tags: [
                `mailbox-${mailboxId}`,
                `mailbox-categories-${mailboxId}`,
            ],
            // revalidate after 7 days
            revalidate: 60 * 60 * 24 * 7,
        }
    )()
})

export const mailboxAliases = cache((mailboxId: string) => {
    return unstable_cache(
        async () => {
            const aliases = await prisma.mailboxAlias.findMany({
                where: {
                    mailboxId,
                }
            })

            return {
                aliases,
                default: aliases.find((a) => a.default)
            };
        },
        [mailboxId],
        {
            tags: [
                `mailbox-${mailboxId}`,
                `mailbox-aliases-${mailboxId}`,
            ],
            // revalidate after 7 days
            revalidate: 60 * 60 * 24 * 7,
        }
    )()
})
