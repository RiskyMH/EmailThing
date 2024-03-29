"use server";
import { getCurrentUser } from "@/utils/jwt";
import { revalidatePath } from "next/cache";
import { userMailboxAccess } from "./tools";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db, DraftEmail, Email } from "@/db";
import { and, eq } from "drizzle-orm";


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

export async function updateEmail(mailboxId: string, emailId: string, type: "inbox" | "sent" | "drafts" | "trash" | "starred" | "mail-page", state: UpdatableEmailConfig) {
    const userId = await getCurrentUser()
    if (!userId || !await userMailboxAccess(mailboxId, userId)) {
        throw new Error("No access to mailbox");
    }

    const baseUrl = `/mail/${mailboxId}${type === "inbox" ? "" : type === "mail-page" ? `/${emailId}` : `/${type}`}`

    if (type === "drafts") {
        if (state.binned) {
            await db.delete(DraftEmail)
                .where(and(
                    eq(DraftEmail.id, emailId),
                    eq(DraftEmail.mailboxId, mailboxId),
                ))
                .execute()

            return revalidatePath(baseUrl)
        }
        if (state.category) throw new Error("Cannot categorize drafts");
        return "Can only delete drafts for now";
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
