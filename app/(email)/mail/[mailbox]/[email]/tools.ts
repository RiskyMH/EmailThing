import { db, Email } from "@/db";
import { and, eq } from "drizzle-orm";
import { cache } from "react"

export const getEmail = cache(async (mailboxId: string, emailId: string) => {
    return db.query.Email.findFirst({
        where: and(
            eq(Email.id, emailId),
            eq(Email.mailboxId, mailboxId)
        ),
        columns: {
            id: true,
            subject: true,
            snippet: true,
            body: true,
            html: true,
            createdAt: true,
            isRead: true,
            isStarred: true,
            binnedAt: true,
            replyTo: true,
            raw: true
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
            },
            recipients: {
                columns: {
                    name: true,
                    address: true,
                    cc: true
                }
            },
            attachments: {
                columns: {
                    filename: true,
                    size: true,
                    mimeType: true,
                    id: true,
                    title: true
                }
            }
        }
    })
})

