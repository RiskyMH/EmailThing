"use server";
import { getCurrentUser } from "@/utils/jwt";
import { revalidatePath } from "next/cache";
import { userMailboxAccess } from "./tools";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db, DraftEmail, Email, EmailAttachments, Mailbox } from "@/db";
import { and, eq, sql } from "drizzle-orm";
import { deleteFile } from "@/utils/s3";


export async function logout() {
    const c = cookies()
    c.delete('token')
    c.delete('mailboxId')

    redirect("/login")
}

export interface UpdatableEmailConfig {
    isStarred?: boolean;
    isRead?: boolean;
    category?: string | null;
    binned?: boolean;
}

export async function updateEmail(mailboxId: string, emailId: string, type: "inbox" | "sent" | "drafts" | "trash" | "starred" | "mail-page" | "temp", state: UpdatableEmailConfig) {
    const userId = await getCurrentUser()
    if (!userId || !await userMailboxAccess(mailboxId, userId)) {
        throw new Error("No access to mailbox");
    }

    const baseUrl = `/mail/${mailboxId}${type === "inbox" ? "" : type === "mail-page" ? `/${emailId}` : `/${type}`}`

    if (type === "drafts") {
        throw new Error("Draft can only be perm deleted")
    }

    await db.update(Email)
        .set({
            isStarred: state.isStarred,
            isRead: state.isRead,
            binnedAt: state.binned ? new Date() : (state.binned === false ? null : undefined),
            categoryId: state.category
        })
        .where(and(
            eq(Email.id, emailId),
            eq(Email.mailboxId, mailboxId),
        ))
        .execute()

    revalidatePath(baseUrl)
}


export async function deleteEmail(mailboxId: string, emailId: string, type: "inbox" | "sent" | "drafts" | "trash" | "starred" | "mail-page" | "temp") {
    const userId = await getCurrentUser()
    if (!userId || !await userMailboxAccess(mailboxId, userId)) {
        throw new Error("No access to mailbox");
    }

    const baseUrl = `/mail/${mailboxId}${type === "inbox" ? "" : type === "mail-page" ? `/${emailId}` : `/${type}`}`

    if (type === "drafts") {
        await db.delete(DraftEmail)
            .where(and(
                eq(Email.id, emailId),
                eq(Email.mailboxId, mailboxId),
            ))

        return revalidatePath(baseUrl)
    }

    const email = await db.query.Email.findFirst({
        where: and(
            eq(Email.id, emailId),
            eq(Email.mailboxId, mailboxId),
        ),
        columns: {
            size: true,
        }
    })

    if (!email) {
        revalidatePath(baseUrl)
        return { error: "Can't find email" }
    }

    const attachments = await db.query.EmailAttachments.findMany({
        where: eq(EmailAttachments.emailId, emailId),
        columns: {
            id: true,
            filename: true,
        }
    })

    await Promise.all([
        deleteFile(`${mailboxId}/${emailId}`),
        deleteFile(`${mailboxId}/${emailId}/email.eml`),
        ...attachments.map((attachment) => deleteFile(`${mailboxId}/${emailId}/${attachment.id}/${attachment.filename}`)),
    ])

    await db.batch([
        db.delete(Email)
            .where(and(
                eq(Email.id, emailId),
                eq(Email.mailboxId, mailboxId),
            )),

        db.update(Mailbox)
            .set({
                storageUsed: sql`${Mailbox.storageUsed} - ${email!.size}`
            })
            .where(eq(Mailbox.id, mailboxId))
    ])

    return revalidatePath(baseUrl)
}
