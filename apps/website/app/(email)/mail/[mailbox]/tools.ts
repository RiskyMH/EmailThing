import { prisma } from "@email/db";
import { cache } from "react";


export const getMailbox = cache(async (mailboxId: string, userId: string) => {
    if (!mailboxId || !userId) throw new Error("Missing required fields")
    console.log(mailboxId, userId)
    const mailbox = await prisma.mailbox.findUnique({
        where: {
            id: mailboxId,
            users: {
                some: {
                    userId
                }
            },
        },
        select: {
            id: true,
            aliases: {
                where: {
                    default: true,
                },
                select: {
                    default: true,
                    name: true,
                    alias: true,
                }
            }
        }
    })

    if (!mailbox) return null

    return {
        id: mailbox.id,
        primaryAlias: mailbox.aliases.find((a) => a.default),
    };
});