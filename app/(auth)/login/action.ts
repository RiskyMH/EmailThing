"use server";
import { db, MailboxForUser, User } from "@/db";
import { addUserTokenToCookie } from "@/utils/jwt"
import { verifyPassword } from "@/utils/password";
import { userAuthSchema } from "@/validations/auth"
import { eq } from "drizzle-orm";
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"

const errorMsg = "Invalid username or password"

export default async function signIn(data: FormData, callback?: string | null): Promise<{ error?: string | null }> {
    const parsedData = userAuthSchema.safeParse({ username: data.get("username"), password: data.get("password") })
    if (!parsedData.success) {
        return {
            error: errorMsg
        }
    }

    if (!callback) {
        const referer = headers().get("referer")
        if (referer) callback = new URL(referer).searchParams?.get("from")
    }

    // find user
    const user = await db.query.User.findFirst({
        where: eq(User.username, parsedData.data.username),
        columns: {
            id: true,
            password: true,
        }
    })

    if (!user) {
        return { error: errorMsg }
    }

    // verify password
    const verified = verifyPassword(parsedData.data.password, user.password)

    if (!verified) {
        return { error: errorMsg }
    }

    await addUserTokenToCookie(user)

    if (callback) {
        redirect(callback)
    }

    // get the user's mailbox then redirect to it
    const mailboxes = await db.query.MailboxForUser.findMany({
        where: eq(MailboxForUser.userId, user.id),
        columns: {
            mailboxId: true,
        }
    })

    const possibleMailbox = cookies().get("mailboxId")?.value
    if (possibleMailbox && mailboxes.some(({ mailboxId }) => mailboxId === possibleMailbox)) {
        redirect(`/mail/${possibleMailbox}`)
    } else {
        cookies().set("mailboxId", mailboxes[0].mailboxId);
        redirect(`/mail/${mailboxes[0].mailboxId}`)
    }
}