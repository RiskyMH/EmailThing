import PostalMime from 'postal-mime';
import { db, DefaultDomain, Email, EmailAttachments, EmailRecipient, EmailSender, Mailbox, MailboxAlias, MailboxCustomDomain, MailboxForUser, UserNotification, TempAlias, MailboxTokens, Stats } from "@/db";
import { storageLimit } from '@/utils/limits';
import { createId } from '@paralleldrive/cuid2';
import { and, eq, gt, sql } from "drizzle-orm";
import { uploadFile } from '@/utils/s3';
import { getTokenMailbox } from '../tools';

export const revalidate = 0
// export const runtime = 'edge';


export async function POST(request: Request) {
    const { searchParams } = new URL(request.url)

    const { email: rawEmail, from, to } = await request.json() as Record<string, string>
    if (!rawEmail || !from || !to) {
        return Response.json({ error: 'missing required fields' }, { status: 400 })
    }

    const parser = new PostalMime()
    const email = await parser.parse(rawEmail as string);

    const mailboxResult = await getMailbox({
        internal: searchParams.has('internal'),
        zone: searchParams.get('zone') as string,
        auth: request.headers.get("x-auth") as string,
        to
    })
    if (!mailboxResult) {
        return new Response('Unauthorized', { status: 401 })
    }

    const { mailboxId, tempId } = mailboxResult

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
            .values([
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
            ]),

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
            .where(eq(Mailbox.id, mailboxId)),

        // stats!
        db.insert(Stats)
            .values({
                time: todayDate(),
                value: 1,
                type: "receive-email"
            })
            .onConflictDoUpdate({
                target: [Stats.time, Stats.type],
                set: { value: sql`${Stats.value} + 1` }
            })

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
            .execute()

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
    console.log("sent push notifications", emailId)
    await notifyMailbox(mailboxId, {
        title: email.from.address,
        body: email.subject ? slice(email.subject, 200) : undefined,
        url: `/mail/${mailboxId}/${emailId}`,
    })

    return Response.json({
        success: true,
        id: emailId,
    })
}


async function getMailbox({ internal, zone, auth, to }: { internal: boolean, zone: string, auth: string, to: string }) {
    // work out which mailbox to put it in

    if (!internal) {
        // it must be custom domain (so check the token)
        const mailboxId = await getTokenMailbox()
        if (!mailboxId) return null
        return { mailboxId }
    }

    // check if its a default domain (and if so, check the alias and get the mailbox id)
    const defaultDomain = await db.query.DefaultDomain.findFirst({
        where: and(
            eq(DefaultDomain.domain, zone!),
            eq(DefaultDomain.authKey, auth!)
        ),
        columns: {
            id: true,
            tempDomain: true,
        }
    })
    if (!defaultDomain) return null

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

    if (defaultDomain.tempDomain) {
        return { mailboxId: alias?.mailboxId, tempId: alias?.id }
    }
    return { mailboxId: alias?.mailboxId }
}


function slice(text: string, length: number) {
    return text.slice(0, length) + (length < text.length ? '…' : '')
}

import Turndown from "turndown"
import { JSDOM } from "jsdom";
import { notifyMailbox } from '@/utils/notifications';
import { todayDate } from '@/utils/tools';

function emailContent({ text, html }: { text?: string, html?: string }) {
    if (text === "\n") text = undefined
    if (text) return text
    if (!html) return "(no body)"

    const h = html.replace(/<(head|style|script|meta|link|title)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
    const _text = new Turndown()
        .turndown(JSDOM.fragment(h))
        .replaceAll(/\[(https?:\/\/[^\]]+)\]\(\1\)/g, '$1')

    return "<!-- Converted markdown from HTML -->\n" + _text
}