import db, { Mailbox, MailboxForUser } from "@/db";
import { sendEmail } from "@/utils/send-email";
import { DraftEmail, Email, EmailAttachments, EmailRecipient, EmailSender, MailboxAlias } from "@emailthing/db/connect";
import { and, eq, sql } from "drizzle-orm";
import { createMimeMessage } from "mimetext";
import type { ChangesResponse } from "../sync/route";
import { getSession, isValidOrigin } from "../tools";
import { createId } from "@paralleldrive/cuid2";
import { emailSendRatelimit } from "@/utils/redis";

export interface Data extends SaveActionProps {
    draftId: string;
    mailboxId: string;
}

export interface Recipient {
    name: string | null;
    address: string;
    cc?: "cc" | "bcc" | null;
}

export interface SaveActionProps {
    body?: string;
    subject?: string;
    from?: string;
    to?: Recipient[];
    html?: string;
    preview?: string;
    headers?: { key: string; value: string }[];
}

export async function POST(request: Request) {
    const origin = request.headers.get("origin");
    if (!origin || !isValidOrigin(origin)) {
        return new Response("Not allowed", { status: 403 });
    }

    const responseHeaders = {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization,content-type",
        "Access-Control-Allow-Credentials": "false",
        "Access-Control-Max-Age": "3600",
    };

    const data = await request.json() as Data;
    const date = new Date();

    const currentUserId = await getSession(request);
    if (!currentUserId) return Response.json({ error: "Unauthorized" } as SendEmailResponse, { status: 401, headers: responseHeaders });

    const [[mailbox], [userAccess]] = await db.batchFetch([
        db.select({ id: Mailbox.id })
            .from(Mailbox)
            .where(eq(Mailbox.id, data.mailboxId))
            .limit(1),
        db.select()
            .from(MailboxForUser)
            .where(and(
                eq(MailboxForUser.mailboxId, data.mailboxId),
                eq(MailboxForUser.userId, currentUserId),
                eq(MailboxForUser.isDeleted, false)
            ))
            .limit(1),
    ]);

    if (!mailbox || !userAccess) return Response.json({ error: "Access denied to mailbox" } as SendEmailResponse, { status: 403, headers: responseHeaders });

    const ratelimit = await emailSendRatelimit(data.mailboxId);
    if (!ratelimit.allowed) {
        return Response.json(
            { error: "Too many emails sent. Please try again later." } as SendEmailResponse,
            { status: 429, headers: { "Retry-After": (ratelimit.retryAfter / 1000).toString(), ...responseHeaders } }
        );
    }

    if (data.draftId !== "new") {
        const [draft] = await db.select({ id: DraftEmail.id })
            .from(DraftEmail)
            .where(and(
                eq(DraftEmail.id, data.draftId),
                eq(DraftEmail.mailboxId, data.mailboxId),
                eq(DraftEmail.isDeleted, false),
            ))
            .limit(1)

        if (!draft) return Response.json({ error: "Draft not found" } as SendEmailResponse, { status: 404, headers: responseHeaders });
    }

    const { body, subject, from, to, html, headers, mailboxId, draftId } = data;

    if (!subject) {
        return Response.json({ error: "Subject is required" } as SendEmailResponse, { status: 400, headers: responseHeaders });
        // } else if (!body) {
        //     return { error: "Body is required" };
    }

    if (!html && !body) {
        return Response.json({ error: "Body is required" } as SendEmailResponse, { status: 400, headers: responseHeaders });
    }

    if (!from) {
        return Response.json({ error: "From is required" } as SendEmailResponse, { status: 400, headers: responseHeaders });
    }

    if (!to || [...to].filter((e) => !e.cc).length <= 0) {
        return Response.json({ error: "At least one recipient is required" } as SendEmailResponse, { status: 400, headers: responseHeaders });
    }

    // verify alias is valid (and user has access to it)

    const [alias] = await db
        .select({ name: MailboxAlias.name, alias: MailboxAlias.alias })
        .from(MailboxAlias)
        .where(and(
            eq(MailboxAlias.mailboxId, mailboxId),
            eq(sql`lower(${MailboxAlias.alias})`, sql`lower(${from})`),
            eq(MailboxAlias.isDeleted, false),
        ))
        .limit(1);
    if (!alias)
        return Response.json({ error: "Can't find your alias. Make sure you have access to it." } as SendEmailResponse, { status: 400, headers: responseHeaders });

    // now send email!
    const email = createMimeMessage();
    email.setSender({ addr: alias.alias, name: alias.name ?? undefined });
    email.setRecipients(
        to.map(
            (e) =>
                ({
                    addr: e.address,
                    name: e.name || undefined,
                    type: e.cc === "cc" ? "Cc" : e.cc === "bcc" ? "Bcc" : "To",
                }) as const,
        ),
    );
    email.setSubject(subject || "(no subject)");
    if (body) email.addMessage({
        contentType: "text/plain",
        data: body,
    });
    if (html) email.addMessage({
        contentType: "text/html",
        encoding: "base64",
        data: Buffer.from(html).toString("base64"),
    });
    if (headers)
        email.setHeaders(
            headers.reduce(
                (acc: Record<string, string>, { key, value }) => {
                    acc[key] = value;
                    return acc;
                },
                {} as Record<string, string>,
            ),
        );
    email.setHeader("X-UserId", currentUserId);
    email.setHeader("X-MailboxId", mailboxId);

    const e = await sendEmail({
        from: alias.alias,
        to: to.map((e) => e.address),
        data: email,
        important: true,
    });

    if (e?.error) return Response.json(e, { status: 400, headers: responseHeaders });

    // const emailId = createId()
    const emailId = draftId === "new" ? createId() : draftId; // could also make new id here

    // add to sent folder
    await db.batchUpdate([
        db.insert(Email).values({
            id: emailId,
            body: body || "",
            html: html || "",
            subject,
            snippet: body ? body.slice(0, 200) + (200 < body.length ? "…" : "") : "",
            raw: "draft",
            mailboxId,
            isRead: true,
            isSender: true,
            size: body?.length ?? 0,
            createdAt: new Date(),
        }),

        db.insert(EmailRecipient).values(
            to?.map(({ address, name, cc }) => ({
                emailId,
                name: name ?? undefined,
                address,
                cc: !!cc,
            })),
        ),

        db.insert(EmailSender).values({
            emailId,
            name: alias.name ?? undefined,
            address: alias.alias,
        }),

        db
            .update(Mailbox)
            .set({
                storageUsed: sql`${Mailbox.storageUsed} + ${body?.length ?? 0}`,
            })
            .where(eq(Mailbox.id, mailboxId)),

        // delete draft
        db
            .update(DraftEmail)
            .set({
                isDeleted: true,
                body: "<deleted>",
                subject: "<deleted>",
                from: null,
                to: null,
                updatedAt: new Date(),
                headers: [],
                createdAt: new Date(),
            })
            .where(and(eq(DraftEmail.id, draftId), eq(DraftEmail.mailboxId, mailboxId))),
    ]);


    // send the changed data to the client
    const [[mailboxSync], recipientsSync, [senderSync], attachmentsSync, [emailSync], [draftSync]] = await db.batchFetch([
        db.select().from(Mailbox).where(eq(Mailbox.id, mailboxId)).limit(1),
        db.select().from(EmailRecipient).where(eq(EmailRecipient.emailId, emailId)),
        db.select().from(EmailSender).where(eq(EmailSender.emailId, emailId)).limit(1),
        db.select().from(EmailAttachments).where(eq(EmailAttachments.emailId, emailId)),
        db.select().from(Email).where(eq(Email.id, emailId)).limit(1),
        db.select().from(DraftEmail).where(and(eq(DraftEmail.id, draftId), eq(DraftEmail.mailboxId, mailboxId))).limit(1),
    ]);

    return Response.json({
        message: {
            success: "Email sent",
        },
        sync: {
            mailboxs: mailboxSync ? [mailboxSync] : [],
            emails: emailSync ? [{
                ...emailSync,
                recipients: recipientsSync,
                sender: senderSync,
                attachments: attachmentsSync,
            }] : [],
            draftEmails: draftSync ? [draftSync] : [],
        },
    } satisfies SendEmailResponse, { status: 200, headers: responseHeaders });

}

export type SendEmailResponse = {
    message: {
        success: string;
    };
    sync: {
        mailboxs: ChangesResponse["mailboxes"];
        emails: ChangesResponse["emails"];
        draftEmails: ChangesResponse["draftEmails"];
    };
} | {
    error: string;
    link?: string;
}


export function OPTIONS(request: Request) {
    const origin = request.headers.get("origin");
    if (!origin || !isValidOrigin(origin)) {
        return new Response("Not allowed", { status: 403 });
    }

    return new Response("OK", {
        headers: {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "authorization,content-type",
            "Access-Control-Allow-Credentials": "false",
            "Access-Control-Max-Age": "3600",
        },
    });
}
