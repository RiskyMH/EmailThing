"use server";
import { db, InviteCode, Mailbox, MailboxAlias, MailboxForUser, User } from "@/db";
import { addUserTokenToCookie } from "@/utils/jwt"
import { createPasswordHash } from "@/utils/password";
import { userAuthSchema } from "@/validations/auth"
import { impersonatingEmails } from "@/validations/invalid-emails";
import { createId } from "@paralleldrive/cuid2";
import { and, eq, gte, isNull } from "drizzle-orm";
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"

const noInvite = "You need an invite code to signup right now"

export default async function signUp(data: FormData): Promise<{ error?: string | null }> {
    const parsedData = userAuthSchema.safeParse({ username: data.get("username"), password: data.get("password") })
    if (!parsedData.success) {
        return {
            error: parsedData.error.errors[0].message
        }
    }

    if (impersonatingEmails.some(v => parsedData.data.username.includes(v))) {
        return { error: "Invalid username" }
    }

    // currently you require invite code to sign up
    const referer = headers().get("referer")
    if (!referer) return { error: noInvite }
    const inviteCode = new URL(referer).searchParams?.get("invite")
    if (!inviteCode) return { error: noInvite }

    // check if invite code is valid
    const invite = await db.query.InviteCode.findFirst({
        where: and(
            eq(InviteCode.code, inviteCode),
            gte(InviteCode.expiresAt, new Date()),
            isNull(InviteCode.usedAt)
        ),
        columns: {
            expiresAt: true,
            usedAt: true,
        }
    })

    if (!invite) {
        return { error: "Invalid invite code" }
    }

    const existingUser = await db.query.User.findFirst({
        where: eq(User.username, parsedData.data.username)
    })

    if (existingUser) {
        return { error: "Username already taken" }
    }

    // check email alaises to
    const existingEmail = await db.query.MailboxAlias.findFirst({
        where: eq(MailboxAlias.alias, parsedData.data.username + "@emailthing.xyz")
    })

    if (existingEmail) {
        return { error: "Email already taken" }
    }

    // create user and their mailbox
    const userId = createId()
    const mailboxId = createId()

    await db.batch([
        db.insert(User)
            .values({
                id: userId,
                username: parsedData.data.username,
                password: await createPasswordHash(parsedData.data.password),
                email: parsedData.data.username + "@emailthing.xyz",
            }),

        db.insert(Mailbox)
            .values({
                id: mailboxId,
            }),

        db.insert(MailboxForUser)
            .values({
                mailboxId,
                userId,
                role: "OWNER"
            }),

        db.insert(MailboxAlias)
            .values({
                mailboxId,
                alias: parsedData.data.username + "@emailthing.xyz",
                default: true,
                name: parsedData.data.username
            }),

        // invalidate invite code
        db.update(InviteCode)
            .set({
                usedAt: new Date(),
                usedBy: userId
            })
            .where(eq(InviteCode.code, inviteCode))
    ])


    // add user token to cookie 
    await addUserTokenToCookie({ id: userId })
    cookies().set("mailboxId", mailboxId, {
        path: "/",
        expires: new Date("2038-01-19 04:14:07")
    })

    // redirect to mail
    redirect(`/onboarding/welcome`)
}