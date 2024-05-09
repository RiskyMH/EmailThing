import PostalMime from 'postal-mime';
import { db, DefaultDomain, Email, EmailAttachments, EmailRecipient, EmailSender, Mailbox, MailboxAlias, MailboxCustomDomain, MailboxForUser, UserNotification, TempAlias, MailboxTokens } from "@/db";
import { storageLimit } from '@/utils/limits';
import { createId } from '@paralleldrive/cuid2';
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { uploadFile } from '@/utils/s3';
import { sendNotification } from '@/utils/web-push';
import { getTokenMailbox } from '../tools';

export const revalidate = 0
// export const runtime = 'edge';


export async function POST(request: Request) {
    const { searchParams } = new URL(request.url)
    const internal = searchParams.has('internal')

    const { email: rawEmail, from, to } = await request.json() as Record<string, string>
    if (!rawEmail || !from || !to) {
        return Response.json({ error: 'missing required fields' }, { status: 400 })
    }

    const parser = new PostalMime()
    const email = await parser.parse(rawEmail as string);

    // work out which mailbox to put it in
    let mailboxId: string | undefined = undefined
    let tempId: string | undefined

    if (internal) {
        // check if its a default domain (and if so, check the alias and get the mailbox id)
        const defaultDomain = await db.query.DefaultDomain.findFirst({
            where: and(
                eq(DefaultDomain.domain, searchParams.get('zone')!),
                eq(DefaultDomain.authKey, request.headers.get("x-auth")!)
            ),
            columns: {
                id: true,
                tempDomain: true,
            }
        })
        if (!defaultDomain) {
            return new Response('Unauthorized', { status: 401 })
        }

        const alias = defaultDomain.tempDomain ?
            await db.query.TempAlias.findFirst({
                where: and(
                    eq(TempAlias.alias, to),
                    gt(TempAlias.expiresAt, new Date()),
                ),
                columns: {
                    mailboxId: true,
                    id: true
                }
            })
            : await db.query.MailboxAlias.findFirst({
                where: eq(MailboxAlias.alias, to),
                columns: {
                    mailboxId: true,
                    id: true
                }
            })

        if (alias) {
            mailboxId = alias.mailboxId
            if (defaultDomain.tempDomain) {
                tempId = alias.id
            }
        }

    } else {
        // it must be custom domain (so check the token)
        mailboxId = await getTokenMailbox() || undefined
        if (!mailboxId) {
            return new Response('Unauthorized', { status: 401 })
        }
    }

    if (!mailboxId) {
        return new Response('Mailbox not found', { status: 400 })
    }

    console.log({ mailboxId })

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

    const emailId = createId()
    await db.batch([
        db.insert(Email)
            .values({
                id: emailId,
                raw: 's3',
                subject: email.subject,
                body: emailContent(email),
                html: email.html,
                snippet: email.text ? slice(email.text, 200) : null,
                mailboxId,
                replyTo: email.replyTo?.[0]?.address,
                size: emailSize,
                tempId,
            }),

        db.insert(EmailRecipient)
            .values(
                [
                    ...email.to?.map((to) => ({
                        emailId: emailId,
                        address: to.address!,
                        name: to.name,
                        cc: false,
                    })) ?? [],

                    ...email.cc?.map((cc) => ({
                        emailId: emailId,
                        address: cc.address!,
                        name: cc.name,
                        cc: true,
                    })) ?? []
                ]
            ),

        db.insert(EmailSender)
            .values({
                emailId: emailId,
                address: email.from.address!,
                name: email.from.name,
            }),

        // increment the mailbox storage used
        db.update(Mailbox)
            .set({
                storageUsed: sql`${Mailbox.storageUsed} + ${emailSize}`
            })
            .where(eq(Mailbox.id, mailboxId))
    ])

    console.log("inserted email", emailId)

    try {
        // save the email to s3
        const upload = await uploadFile({
            key: `${mailboxId}/${emailId}/email.eml`,
            buffer: Buffer.from(rawEmail),
            contentType: "message/rfc822"
        })
    } catch (e) {
        console.error(e)
    }

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

        try {
            const upload = await uploadFile({
                key: `${mailboxId}/${emailId}/${attId}/${encodeURIComponent(name)}`,
                buffer: attContent,
                contentType: attachment.mimeType
            })
        } catch (e) {
            console.error(e)
        }
    }

    console.log("saved email to s3", emailId)

    // send push notifications
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
        const payload = JSON.stringify({
            title: email.from.address,
            body: email.subject ? slice(email.subject, 200) : undefined,
            url: `/mail/${mailboxId}/${emailId}`,
        })
        if (!n.endpoint || !n.p256dh || !n.auth) return console.error('missing notification data', n)

        const res = await sendNotification({
            subscription: {
                endpoint: n.endpoint,
                keys: {
                    p256dh: n.p256dh,
                    auth: n.auth,
                },
                expirationTime: n.expiresAt,
            },
            data: payload
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

    console.log("sent push notifications", emailId)

    return Response.json({
        success: true,
        id: emailId,
    })
}

function slice(text: string, length: number) {
    return text.slice(0, length) + (length < text.length ? '…' : '')
}

import Turndown from "turndown"
import { JSDOM } from "jsdom";

function emailContent({ text, html }: { text?: string, html?: string }) {
    if (text) return text
    if (!html) return "(no body)"

    const h = html.replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, "")

    return "<!-- Converted markdown from HTML -->\n" + new Turndown().turndown(JSDOM.fragment(h))
}