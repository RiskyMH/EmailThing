import db, { UserNotification, MailboxForUser } from "@/db"
import { eq } from "drizzle-orm"
import { sendNotification } from "./web-push"


export async function notifyMailbox(mailboxId: string, data: { title?: string | null, body?: string | null, url?: string | null }) {
    const notifications = await db
        .select({
            endpoint: UserNotification.endpoint,
            p256dh: UserNotification.p256dh,
            auth: UserNotification.auth,
            expiresAt: UserNotification.expiresAt,
        })
        .from(UserNotification)
        .leftJoin(MailboxForUser, eq(UserNotification.userId, MailboxForUser.userId))
        .where(eq(MailboxForUser.mailboxId, mailboxId))
        .execute()

    await Promise.all(notifications.map(async (n) => {
        if (!n.endpoint || !n.p256dh || !n.auth) return console.error('missing notification data', n)

        const res = await sendNotification({
            subscription: {
                endpoint: n.endpoint,
                keys: {
                    p256dh: n.p256dh,
                    auth: n.auth,
                },
                expirationTime: null
            },
            data: JSON.stringify(data)
        })

        if (!res.ok) {
            // delete the notification if it's no longer valid
            if (res.status === 410) {
                await db.delete(UserNotification)
                    .where(eq(UserNotification.endpoint, n.endpoint))
                    .execute()
            }
            console.error(await res.text())
        }
    }))



}