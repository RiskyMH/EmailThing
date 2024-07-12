import db, { Email, EmailRecipient, EmailSender, Mailbox, MailboxAlias } from "@/db"
import { getTokenMailbox } from "../tools"
import { env } from "@/utils/env"
import { and, eq, sql } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"
import { sendEmail } from "@/utils/send-email"
import { createMimeMessage, Mailbox as MimeMailbox } from "mimetext"

export const revalidate = 0

interface EmailPostOptions {
    html?: string
    text?: string
    subject: string
    from: string
    to: string[]
    cc?: string[]
    bcc?: string[]
    reply_to?: string
    config?: {

    } & Record<string, any>,
    headers?: Record<string, string>
}

// 30 requests per 60 seconds
const MAX_REQUESTS_PER_WINDOW = 30;
const WINDOW_DURATION_MS = 60 * 1000;

const ratelimit = new Map<string, { count: number, resetAt: Date }>();

export async function POST(request: Request) {
    const mailboxId = await getTokenMailbox();
    if (!mailboxId) {
        return new Response('Unauthorized', { status: 401 });
    }

    const key = mailboxId;
    let rate = ratelimit.get(key);

    if (!rate || rate.resetAt < new Date()) {
        // Reset the rate limit if it's expired
        ratelimit.set(key, { count: 1, resetAt: new Date(Date.now() + WINDOW_DURATION_MS) });
    } else {
        // Increment the request count if within the window
        rate.count++;
        if (rate.count > MAX_REQUESTS_PER_WINDOW) {
            const timeUntilReset = rate.resetAt.getTime() - Date.now();
            return Response.json({ error: 'rate limited' }, { status: 429, headers: { 'Retry-After': timeUntilReset.toString() } });
        }
    }
    const data = await request.json() as Partial<EmailPostOptions>
    if (!data.to?.length || !data.from || !data.subject) return Response.json({ error: 'missing required fields' }, { status: 400 })

    const fromObj = getInfoFromAddress(data.from)

    // verify alias is valid (and user has access to it)
    const alias = await db.query.MailboxAlias.findFirst({
        where: and(
            eq(MailboxAlias.mailboxId, mailboxId),
            eq(MailboxAlias.alias, fromObj.email)
        ),
        columns: {
            name: true,
            alias: true
        }
    })
    if (!alias) return Response.json({ error: 'invalid alias' }, { status: 400 })

    const mail = createMimeMessage()
    mail.setSender({ addr: alias.alias, name: fromObj.name })
    mail.setRecipients([
        ...data.to.map(getInfoFromAddress).map(e => ({ addr: e.email, name: e.name, type: "To" } as const)),
        ...(data.cc?.map(getInfoFromAddress).map(e => ({ addr: e.email, name: e.name, type: "Cc" } as const)) || []),
        ...(data.bcc?.map(getInfoFromAddress).map(e => ({ addr: e.email, name: e.name, type: "Bcc" } as const)) || []),
    ])
    mail.setSubject(data.subject)
    if (data.text) mail.addMessage({
        contentType: "text/plain",
        data: data.text
    })
    if (data.html) mail.addMessage({
        contentType: "text/html",
        data: data.html
    })
    if (data.reply_to) mail.setHeader("Reply-To", new MimeMailbox(getInfoFromAddress(data.reply_to).email))
    mail.setHeader("X-MailboxId", mailboxId)

    const e = await sendEmail({
        from: alias.alias,
        to: [...data.to, ...(data.cc ?? []), ...(data.bcc ?? [])].map(e => getInfoFromAddress(e).email),
        data: mail.asRaw()
    })

    if (e?.error) return Response.json(e, { status: 500 })

    // if (data.config?.save_in_sent ?? true) {
    const emailId = createId()

    const size = (data.html || '').length + (data.text || '').length

    // add to sent folder
    await db.batch([
        db.insert(Email)
            .values({
                id: emailId,
                body: data.text || "",
                html: data.html || "",
                subject: data.subject,
                snippet: data.text ? (data.text.slice(0, 200) + (200 < data.text.length ? '…' : '')) : '',
                raw: "draft",
                mailboxId,
                isRead: true,
                isSender: true,
                size,
                createdAt: new Date(),
            }),

        db.insert(EmailRecipient)
            .values([
                ...data.to.map((address) => ({
                    emailId,
                    address,
                    cc: false,
                })),

                ...data.cc?.map((address) => ({
                    emailId,
                    address,
                    cc: true,
                })) ?? [],
            ]),

        db.insert(EmailSender)
            .values({
                emailId,
                name: alias.name ?? undefined,
                address: alias.alias
            }),

        db.update(Mailbox)
            .set({
                storageUsed: sql`${Mailbox.storageUsed} + ${size}`,
            })
            .where(eq(Mailbox.id, mailboxId)),
    ])
    return Response.json({ success: true, emailId })
    // }

    // return Response.json({ success: true })

}

function getInfoFromAddress(email: string) {
    // RiskyMH@emailthing.xyz => { address: "RiskyMH@emailthing.xyz" }
    // RiskyMH <RiskyMH@emailthing.xyz> => { address: "RiskyMH@emailthing.xyz", name: "RiskyMH" }
    const match = email.match(/(.*)<(.*)>/)
    if (match) {
        return { name: match[1].trim(), email: match[2].trim() }
    } else {
        return { email }
    }
}
