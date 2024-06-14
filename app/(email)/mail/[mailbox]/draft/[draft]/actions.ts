"use server";

import { db, DraftEmail, Email, EmailRecipient, EmailSender, Mailbox, MailboxAlias } from "@/db";
import { redirect } from "next/navigation";
import { env } from "@/utils/env";
import { userMailboxAccess } from "../../tools";
import { getCurrentUser } from "@/utils/jwt";
import { revalidatePath } from "next/cache";
import { getData } from "./tools";
import { and, eq, sql } from "drizzle-orm";
import { sendEmail } from "@/utils/send-email";

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
    const { body, subject, from, to } = getData(data)

    if (!subject) {
        return { error: "Subject is required" };
    } else if (!body) {
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
    if (!alias) throw new Error("Alias not found")

    // now send email (via mailchannels)!
    const e = await sendEmail({
        personalizations: [
            {
                to: to!.filter(({ cc }) => cc !== "cc" && cc !== "bcc").map(({ address, name }) => ({ email: address, name: name || undefined })),
                cc: to!.filter(({ cc }) => cc === "cc").map(({ address, name }) => ({ email: address, name: name || undefined })),
                bcc: to!.filter(({ cc }) => cc === "bcc").map(({ address, name }) => ({ email: address, name: name || undefined })),
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
        subject: subject || "(no subject)",
        content: [
            body ? ({
                type: "text/plain",
                value: body
            }) : undefined,
        ],
        headers: {
            "X-UserId": userId,
            "X-MailboxId": mailboxId
        }
    })

    if (e?.error) return e

    // const emailId = createId()
    const emailId = draftId // could also make new id here

    // add to sent folder
    await db.batch([
        db.insert(Email)
            .values({
                id: emailId,
                body: body || "",
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
