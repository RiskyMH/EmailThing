"use server";

import { db, DraftEmail, Email, EmailRecipient, EmailSender, Mailbox, MailboxAlias } from "@/db";
import { redirect } from "next/navigation";
import { env } from "@/utils/env";
import { userMailboxAccess } from "../../tools";
import { getCurrentUser } from "@/utils/jwt";
import { revalidatePath } from "next/cache";
import { getData, makeHtml } from "./tools";
import { and, eq, sql } from "drizzle-orm";
import { sendEmail } from "@/utils/send-email";
import { createMimeMessage } from "mimetext";
import Turndown from "turndown"
import { JSDOM } from "jsdom";

export async function sendEmailAction(mailboxId: string, draftId: string, data: FormData) {
    const userId = await getCurrentUser()
    if (!userId || !await userMailboxAccess(mailboxId, userId)) {
        throw new Error("Mailbox not found");
    }

    if (!data) return { error: "No data???" }

    const mail = await db.query.DraftEmail.findFirst({
        where: and(
            eq(DraftEmail.id, draftId),
            eq(DraftEmail.mailboxId, mailboxId),
        ),
        columns: {
            // body: true,
            // subject: true,
            // from: true,
            // to: true,
            id: true
        }
    })
    if (!mail) return { error: "Draft doesn't exist, make sure you haven't sent it already" }

    // let { body, subject, from, to } = mail
    const { body, subject, from, to, html, headers } = getData(data)

    if (!subject) {
        return { error: "Subject is required" };
        // } else if (!body) {
        //     return { error: "Body is required" };
    } else if (!html) {
        return { error: "Body is required" };
    } else if (!from) {
        return { error: "From is required" };
    } else if (!to || [...to].filter(e => !e.cc).length <= 0) {
        return { error: "At least one recipient is required" };
    }

    // verify alias is valid (and user has access to it)
    const alias = await db.query.MailboxAlias.findFirst({
        where: and(
            eq(MailboxAlias.mailboxId, mailboxId),
            eq(MailboxAlias.alias, from!)
        ),
        columns: {
            name: true,
            alias: true
        }
    })
    if (!alias) return { error: "Can't find your alias. Make sure you have access to it." }

    const text = new Turndown()
        .turndown(JSDOM.fragment(html))
        .replaceAll(/\[(https?:\/\/[^\]]+)\]\(\1\)/g, '$1')
    const actualHTML = makeHtml(html)

    // now send email!
    const email = createMimeMessage()
    email.setSender({ addr: alias.alias, name: alias.name ?? undefined })
    email.setRecipients(to.map(e => ({ addr: e.address, name: e.name || undefined, type: e.cc == "cc" ? "Cc" : e.cc === "bcc" ? "Bcc" : "To" }) as const))
    email.setSubject(subject || "(no subject)")
    email.addMessage({
        contentType: "text/plain",
        data: text
    })
    email.addMessage({
        contentType: "text/html",
        encoding: "base64",
        data: Buffer.from(actualHTML).toString("base64")
    })
    if (headers) email.setHeaders(headers.reduce((acc: Record<string, string>, { key, value }) => { acc[key] = value; return acc }, {} as Record<string, string>))
    email.setHeader("X-UserId", userId)
    email.setHeader("X-MailboxId", mailboxId)

    const e = await sendEmail({
        from: alias.alias,
        to: to.map(e => e.address),
        data: email.asRaw()
    })

    if (e?.error) return e

    // const emailId = createId()
    const emailId = draftId // could also make new id here

    // add to sent folder
    await db.batch([
        db.insert(Email)
            .values({
                id: emailId,
                body: text || "",
                html: actualHTML || "",
                subject,
                snippet: body ? (body.slice(0, 200) + (200 < body.length ? '…' : '')) : '',
                raw: "draft",
                mailboxId,
                isRead: true,
                isSender: true,
                size: body?.length ?? 0,
                createdAt: new Date(),
            }),

        db.insert(EmailRecipient)
            .values(to!.map(({ address, name, cc }) => ({
                emailId,
                name: name ?? undefined,
                address,
                cc: !!cc ?? undefined
            }))),

        db.insert(EmailSender)
            .values({
                emailId,
                name: alias.name ?? undefined,
                address: alias.alias
            }),

        db.update(Mailbox)
            .set({
                storageUsed: sql`${Mailbox.storageUsed} + ${body?.length ?? 0}`,
            })
            .where(eq(Mailbox.id, mailboxId)),

        // delete draft
        db.delete(DraftEmail)
            .where(and(
                eq(DraftEmail.id, draftId),
                eq(DraftEmail.mailboxId, mailboxId)
            ))
    ])

    return redirect(`/mail/${mailboxId}/${emailId}`)
}


export async function saveDraftAction(mailboxId: string, draftId: string, data: FormData) {
    const userId = await getCurrentUser()
    if (!userId || !await userMailboxAccess(mailboxId, userId)) {
        throw new Error("Mailbox not found");
    }

    await db.update(DraftEmail)
        // TODO: preview field
        .set(getData(data))
        .where(and(
            eq(DraftEmail.id, draftId),
            eq(DraftEmail.mailboxId, mailboxId)
        ))
        .execute()

    revalidatePath(`/mail/${mailboxId}/draft/${draftId}`)
};

export async function deleteDraftAction(mailboxId: string, draftId: string) {
    const userId = await getCurrentUser()
    if (!userId || !await userMailboxAccess(mailboxId, userId)) {
        throw new Error("Mailbox not found");
    }

    await db.delete(DraftEmail)
        .where(and(
            eq(DraftEmail.id, draftId),
            eq(DraftEmail.mailboxId, mailboxId)
        ))
        .execute()

    return redirect(`/mail/${mailboxId}`)
};

export async function saveDraftHeadersAction(mailboxId: string, draftId: string, data: FormData) {
    const userId = await getCurrentUser()
    if (!userId || !await userMailboxAccess(mailboxId, userId)) {
        throw new Error("Mailbox not found");
    }

    const headers = data.getAll("header").map((id) => {
        const key = (data.get(`header:${id}:name`) || "") as string
        const value = (data.get(`header:${id}:value`) || "") as string

        if (!key) return
        return { key, value }
    }).filter(e => !!e)

    // temporary measure because mimetext only supports one value per key, so just force that
    const seenKeys = new Set<string>();
    const uniqueHeaders = headers.filter(header => {
        if (seenKeys.has(header.key)) {
            return false;
        }
        seenKeys.add(header.key);
        return true;
    });

    await db.update(DraftEmail)
        // .set({ headers })
        .set({ headers: uniqueHeaders })
        .where(and(
            eq(DraftEmail.id, draftId),
            eq(DraftEmail.mailboxId, mailboxId)
        ))
        .execute()

    revalidatePath(`/mail/${mailboxId}/draft/${draftId}`)
};
