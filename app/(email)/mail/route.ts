import { db, MailboxForUser } from "@/db";
import { getCurrentUser, removeToken } from "@/utils/jwt";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const runtime = process.env.STANDALONE ? "nodejs" : "edge"
export const revalidate = 0

export async function GET() {
    // check if user token is valid (if expired, redirect to login)
    const userId = await getCurrentUser();

    if (!userId) {
        removeToken()
        return redirect("/login")
    }

    // get the mailbox based on mailboxId cookie
    const mailboxId = cookies().get("mailboxId");

    if (mailboxId) {
        return redirect(`/mail/${mailboxId.value}`)
    } else {
        const firstMailbox = await db.query.MailboxForUser.findFirst({
            where: eq(MailboxForUser.userId, userId),
            columns: { mailboxId: true }
        })
        if (firstMailbox) {
            cookies().set("mailboxId", firstMailbox.mailboxId)
            return redirect(`/mail/${firstMailbox.mailboxId}`)
        } else {
            removeToken()
            cookies().delete("mailboxId")
            return redirect("/login")
        }
    }
}