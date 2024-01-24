"use server";
import { getCurrentUser } from "@/app/utils/user";
import { prisma } from "@email/db";
import { revalidatePath } from "next/cache";
import { userMailboxAccess } from "../tools";
import { UpdatableEmailConfig, EmailItemProps } from "./email-item";

export async function updateEmail(mailboxId: string, emailId: string, type: EmailItemProps["type"], state: UpdatableEmailConfig) {
    "use server"
    const userId = await getCurrentUser()
    if (!userId || !await userMailboxAccess(mailboxId, userId)) {
        throw new Error("No access to mailbox");
    }

    const baseUrl = `/mail/${mailboxId}${type === "inbox" ? "" : `/${type}`}`

    if (type === "drafts") {
        if (state.binned) {
            await prisma.draftEmail.delete({
                where: {
                    id: emailId,
                    mailboxId: mailboxId
                }
            })
            return revalidatePath(baseUrl)

        }
        if (state.category) throw new Error("Cannot categorize drafts");
        return "Can only delete drafts for now";
    }

    await prisma.email.update({
        data: {
            isStarred: state.isStarred,
            isRead: state.isRead,
            binnedAt: state.binned ? new Date() : (state.binned === false ? null : undefined),
            categoryId: state.category
        },
        where: {
            id: emailId,
            mailboxId,
        }

    });

    revalidatePath(baseUrl)
}
