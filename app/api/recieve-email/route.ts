// @ts-ignore
import PostalMime from 'postal-mime';
type PostalMime = import("../../../node_modules/postal-mime/postal-mime").default;
import { db, DefaultDomain, Email, EmailAttachments, EmailRecipient, EmailSender, Mailbox, MailboxAlias, MailboxCustomDomain, MailboxForUser, UserNotification } from "@/db";
import { env } from '@/utils/env';
import webpush from 'web-push';
import { storageLimit } from '@/utils/limits';
import { Upload } from "@aws-sdk/lib-storage"
import { S3Client } from "@aws-sdk/client-s3"
import { createId } from '@paralleldrive/cuid2';
import { and, eq, sql } from "drizzle-orm";


webpush.setVapidDetails(
    'mailto:test@example.com',
    env.NEXT_PUBLIC_NOTIFICATIONS_PUBLIC_KEY,
    env.WEB_NOTIFICATIONS_PRIVATE_KEY
)


export const revalidate = 0

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url)
    const zone = searchParams.get('zone')
    const auth = request.headers.get("x-auth")
    // if (auth !== env.EMAIL_AUTH_TOKEN) {
    //     return Response.json({ error: 'unauthorized' }, { status: 401 })
    // }

    const { email: rawEmail, from, to } = await request.json() as Record<string, string>
    if (!rawEmail || !from || !to) {
        return Response.json({ error: 'missing required fields' }, { status: 400 })
    }

    const parser = new PostalMime() as PostalMime
    const email = await parser.parse(rawEmail as string);

    // work out which mailbox to put it in
    let mailboxId: string | undefined = undefined

    // check if its a default domain first (and if so, check the alias and get the mailbox id)
    const defaultDomain = await db.query.DefaultDomain.findFirst({
        where: and(
            eq(DefaultDomain.domain, zone!),
            eq(DefaultDomain.authKey, auth!)
        ),
        columns: {
            id: true
        }
    })

    if (defaultDomain) {
        const alias = await db.query.MailboxAlias.findFirst({
            where: eq(MailboxAlias.alias, to),
            columns: {
                mailboxId: true
            }
        })

        if (alias) {
            mailboxId = alias.mailboxId
        }

    } else {
        // check if its a custom domain
        const customDomain = await db.query.MailboxCustomDomain.findFirst({
            where: and(
                eq(MailboxCustomDomain.domain, zone!),
                eq(MailboxCustomDomain.authKey, auth!)
            ),
            columns: {
                mailboxId: true
            }
        })

        if (customDomain) {
            mailboxId = customDomain.mailboxId
        }
    }

    if (!mailboxId) {
        return new Response('Mailbox not found', { status: 400 })
    }

    // get storage used and see if over limit
    const mailbox = await db.query.Mailbox.findFirst({
        where: eq(Mailbox.id, mailboxId),
        columns: {
            storageUsed: true,
            plan: true,
        }
    })

    const limit = storageLimit[mailbox!.plan]
    if (mailbox!.storageUsed > limit) {
        // todo: send email to user to warn them about unreceived emails 
        // (and they can upgrade to pro to get more storage or delete some emails to free up space)
        return new Response('Mailbox over storage limit', { status: 400 })
    }

    const emailSize = new Blob([rawEmail]).size

    const body = email.text || email.html || email.attachments.map((a) => a.content).join('\n')

    const emailId = createId()
    await db.batch([
        db.insert(Email)
            .values({
                id: emailId,
                raw: 's3',
                subject: email.subject,
                body: body,
                html: email.html,
                snippet: slice(body, 200),
                mailboxId,
                replyTo: email.replyTo?.[0]?.address,
                size: emailSize,
            }),

        db.insert(EmailRecipient)
            .values(
                email.to?.map((to) => ({
                    emailId: emailId,
                    address: to.address,
                    name: to.name,
                    cc: false,
                })) ?? []
            ),

        db.insert(EmailSender)
            .values({
                emailId: emailId,
                address: email.from.address,
                name: email.from.name,
            }),

        // increment the mailbox storage used
        db.update(Mailbox)
            .set({
                storageUsed: sql`${Mailbox.storageUsed} + ${emailSize}`
            })
            .where(eq(Mailbox.id, mailboxId))
    ])

    const s3 = new S3Client({
        credentials: {
            accessKeyId: env.S3_KEY_ID,
            secretAccessKey: env.S3_SECRET_ACCESS_KEY,
        },
        endpoint: env.S3_URL,
        region: "auto"
    })
    // save the email to s3
    const upload = new Upload({
        client: s3,
        params: {
            Bucket: "email",
            Key: `${mailboxId}/${emailId}/email.eml`,
            Body: rawEmail,
            ContentType: "message/rfc822",
        }
    })

    await upload.done()

    for (const attachment of email.attachments) {
        const name = attachment.filename || attachment.mimeType || createId()

        const attContent = Buffer.from(attachment.content)
        const attId = createId()
        await db.insert(EmailAttachments)
            .values({
                id: attId,
                emailId: emailId,
                filename: encodeURIComponent(name),
                title: name,
                mimeType: attachment.mimeType,
                size: attContent.byteLength,
            })

        const upload = new Upload({
            client: s3,
            params: {
                Bucket: "email",
                Key: `${mailboxId}/${emailId}/${attId}/${encodeURIComponent(name)}`,
                Body: attContent,
                ContentType: attachment.mimeType,
            }
        })
        await upload.done()
    }


    // send push notifications
    const notifications = await db
        .select({ endpoint: UserNotification.endpoint, p256dh: UserNotification.p256dh, auth: UserNotification.auth })
        .from(UserNotification)
        .leftJoin(MailboxForUser, eq(UserNotification.userId, MailboxForUser.userId))
        .where(eq(MailboxForUser.mailboxId, mailboxId))
        .execute()

    await Promise.all(notifications.map(async (n) => {
        const payload = JSON.stringify({
            title: email.from.address,
            body: email.subject ? slice(email.subject, 200) : undefined,
            url: `/mail/${mailboxId}/${emailId}`,
        })
        if (!n.endpoint || !n.p256dh || !n.auth) return console.error('missing notification data', n)

        try {
            await webpush.sendNotification({
                endpoint: n.endpoint,
                keys: {
                    p256dh: n.p256dh,
                    auth: n.auth,
                }
            }, payload)

        } catch (e: any) {
            // delete the notification if it's no longer valid
            if (e.statusCode === 410) {
                await db.delete(UserNotification)
                    .where(eq(UserNotification.endpoint, n.endpoint))
                    .execute()
            } else {
                console.error(e)
            }
        }
    }))


    return Response.json({
        success: true,
        id: emailId,
    })
}

function slice(text: string, length: number) {
    return text.slice(0, length) + (length < text.length ? '…' : '')
}