import { prisma } from "@email/db"
import { cache } from "react"

export const getEmail = cache(async (mailboxId: string, emailId: string) => {
    const email = await prisma.email.findUnique({
        where: {
            id: emailId,
            mailboxId
        },
        select: {
            id: true,
            subject: true,
            snippet: true,
            body: true,
            html: true,
            createdAt: true,
            isRead: true,
            isStarred: true,
            binnedAt: true,
            recipients: {
                select: {
                    address: true,
                    name: true,
                    cc: true
                }
            },
            category: {
                select: {
                    name: true,
                    id: true,
                    color: true
                }
            },
            from: {
                select: {
                    name: true,
                    address: true
                }
            }
        }
    })

    return email
})

