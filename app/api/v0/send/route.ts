import db, { Email, EmailRecipient, EmailSender, Mailbox, MailboxAlias } from "@/db"
import { getTokenMailbox } from "../tools"
import { env } from "@/utils/env"
import { and, eq, sql } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"

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
        save_in_sent?: boolean
    },
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

    // now send email (via mailchannels)!
    const e = await fetch("https://email.riskymh.workers.dev?dry-run=false", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-auth": env.EMAIL_AUTH_TOKEN
        } as Record<string, string>,
        body: JSON.stringify({
            personalizations: [
                {
                    to: data.to.map(getInfoFromAddress),
                    cc: data.cc?.map(getInfoFromAddress),
                    bcc: data.bcc?.map(getInfoFromAddress),
                    ...(env.EMAIL_DKIM_PRIVATE_KEY ? ({
                        dkim_domain: "emailthing.xyz",
                        dkim_private_key: env.EMAIL_DKIM_PRIVATE_KEY,
                        dkim_selector: "emailthing",
                    }) : []),
                },
            ],
            from: {
                email: alias.alias,
                name: alias.name ?? undefined
            },
            reply_to: data.reply_to ? getInfoFromAddress(data.reply_to) : undefined,
            subject: data.subject || "(no subject)",
            content: [
                ...(data.text ? [{
                    type: "text/plain",
                    value: data.text
                }] : []),
                ...(data.html ? [{
                    type: "text/html",
                    value: data.html
                }] : [])
            ],
            headers: data.headers,
        }),
    })

    if (!e.ok) {
        console.error(await e.text())
        return Response.json({ error: 'failed to send email' }, { status: 500 })
    }

    console.log((await e.json())?.data)

    if (data.config?.save_in_sent ?? true) {
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
    }

    return Response.json({ success: true })

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
