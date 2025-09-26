import { getSession, isValidOrigin } from "../tools";
import { DraftEmail, Email, EmailSender, EmailRecipient, MailboxAlias, EmailAttachments } from "@emailthing/db/connect";
import { eq, sql } from "drizzle-orm";
import { and } from "drizzle-orm";
import db, { Mailbox, MailboxForUser } from "@/db";
import { createMimeMessage } from "mimetext";
import { sendEmail } from "@/utils/send-email";
import type { ChangesResponse } from "../sync/route";


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

    const [mailbox, userAccess] = await db.batchFetch([
        db.query.Mailbox.findFirst({
            where: eq(Mailbox.id, data.mailboxId),
            columns: {
                id: true,
            },
        }),
        db.query.MailboxForUser.findFirst({
            where: and(eq(MailboxForUser.mailboxId, data.mailboxId), eq(MailboxForUser.userId, currentUserId), eq(MailboxForUser.isDeleted, false)),
        }),
    ]);

    if (!mailbox || !userAccess) return Response.json({ error: "Access denied to mailbox" } as SendEmailResponse, { status: 403, headers: responseHeaders });

    const draft = await db.query.DraftEmail.findFirst({
        where: and(
            eq(DraftEmail.id, data.draftId),
            eq(DraftEmail.mailboxId, data.mailboxId),
            eq(DraftEmail.isDeleted, false),
        ),
        columns: {
            id: true,
        },
    });

    if (!draft) return Response.json({ error: "Draft not found" } as SendEmailResponse, { status: 404, headers: responseHeaders });

    const { body, subject, from, to, html, headers, mailboxId, draftId } = data;

    if (!subject) {
        return Response.json({ error: "Subject is required" } as SendEmailResponse, { status: 400, headers: responseHeaders });
        // } else if (!body) {
        //     return { error: "Body is required" };
    }

    if (!html || !body) {
        return Response.json({ error: "Body is required" } as SendEmailResponse, { status: 400, headers: responseHeaders });
    }

    if (!from) {
        return Response.json({ error: "From is required" } as SendEmailResponse, { status: 400, headers: responseHeaders });
    }

    if (!to || [...to].filter((e) => !e.cc).length <= 0) {
        return Response.json({ error: "At least one recipient is required" } as SendEmailResponse, { status: 400, headers: responseHeaders });
    }

    // verify alias is valid (and user has access to it)
    const alias = await db.query.MailboxAlias.findFirst({
        where: and(
            eq(MailboxAlias.mailboxId, mailboxId),
            eq(sql`lower(${MailboxAlias.alias})`, sql`lower(${from})`),
            eq(MailboxAlias.isDeleted, false),
        ),
        columns: {
            name: true,
            alias: true,
        },
    });
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
    email.addMessage({
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
    const emailId = draftId; // could also make new id here

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
    const sync = await db.batchFetch([
        db.query.Mailbox.findFirst({
            where: and(eq(Mailbox.id, mailboxId)),
        }),
        db.query.EmailRecipient.findMany({
            where: and(eq(EmailRecipient.emailId, emailId)),
        }),
        db.query.EmailSender.findFirst({
            where: and(eq(EmailSender.emailId, emailId)),
        }),
        db.query.EmailAttachments.findMany({
            where: and(eq(EmailAttachments.emailId, emailId)),
        }),
        db.query.Email.findFirst({
            where: and(eq(Email.id, emailId)),
        }),
        db.query.DraftEmail.findFirst({
            where: and(eq(DraftEmail.id, draftId), eq(DraftEmail.mailboxId, mailboxId)),
        }),
    ]);

    return Response.json({
        message: {
            success: "Email sent",
        },
        sync: {
            mailboxs: sync[0] ? [sync[0]] : [],
            emails: sync[4] ? [{
                ...sync[4],
                recipients: sync[1],
                sender: sync[2],
                attachments: sync[3],
            }] : [],
            draftEmails: sync[5] ? [sync[5]] : [],
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
