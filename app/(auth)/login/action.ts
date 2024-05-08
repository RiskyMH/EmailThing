"use server";
import { db, MailboxForUser, User, ResetPasswordToken, PasskeyCredentials } from "@/db";
import { env } from "@/utils/env";
import { addUserTokenToCookie } from "@/utils/jwt"
import { verifyCredentials, verifyCredentialss } from "@/utils/passkeys";
import { createPasswordHash, verifyPassword } from "@/utils/password";
import { userAuthSchema } from "@/validations/auth"
import { createId } from "@paralleldrive/cuid2";
import { and, eq, lt, gt } from "drizzle-orm";
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
        if (referer) {
            callback = new URL(referer).searchParams?.get("from")
        } else {
            const mailboxId = cookies().get("mailboxId")
            if (mailboxId) {
                callback = `/mail/${mailboxId.value}`
            }
        }
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
    const verified = await verifyPassword(parsedData.data.password, user.password)

    if (!verified) {
        return { error: errorMsg }
    } else if (typeof verified === "string") {
        // this is the new hash
        await db.update(User)
            .set({ password: verified })
            .where(eq(User.id, user.id))
            .execute()
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
        cookies().set("mailboxId", mailboxes[0].mailboxId, {
            path: "/",
            expires: new Date("2038-01-19 04:14:07")
        });
        redirect(`/mail/${mailboxes[0].mailboxId}`)
    }
}

export async function signInPasskey(credential: Credential, callback?: string | null): Promise<{ error?: string | null }> {
    console.log(credential)
    if (!callback) {
        const referer = headers().get("referer")
        if (referer) {
            callback = new URL(referer).searchParams?.get("from")
        } else {
            const mailboxId = cookies().get("mailboxId")
            if (mailboxId) {
                callback = `/mail/${mailboxId.value}`
            }
        }
    }

    const cred = await db.query.PasskeyCredentials.findFirst({
        where: eq(PasskeyCredentials.credentialId, credential.id)
    });
    if (cred == null) {
        return { error: "Passkey not found" };
    }

    let verification;

    try {
        verification = await verifyCredentialss("login", credential, cred);
    } catch (error) {
        console.error(error);
        return { error: "Failed to verify passkey :(" }
    }

    console.log(verification)
    if (!verification.userVerified) {
        return { error: "Failed to verify passkey" }
    }

    // find user
    const user = await db.query.User.findFirst({
        where: eq(User.id, cred.userId),
        columns: {
            id: true,
            password: true,
        }
    })

    if (!user) {
        return { error: "Can't find user" }
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
        cookies().set("mailboxId", mailboxes[0].mailboxId, {
            path: "/",
            expires: new Date("2038-01-19 04:14:07")
        });
        redirect(`/mail/${mailboxes[0].mailboxId}`)
    }
}

export async function resetPassword(username: string) {
    const user = await db.query.User.findFirst({
        where: eq(User.username, username),
        columns: {
            id: true,
            backupEmail: true,
            username: true
        }
    })

    if (!user?.backupEmail) return

    // send email
    const token = createId()
    await db.insert(ResetPasswordToken)
        .values({
            token,
            userId: user.id,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
            createdAt: new Date()
        })
        .execute()

    // send email
    const e = await fetch("https://email.riskymh.workers.dev", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-auth": env.EMAIL_AUTH_TOKEN
        } as Record<string, string>,
        body: JSON.stringify({
            personalizations: [
                {
                    to: [{ email: user.backupEmail }]
                },
            ],
            from: {
                email: "system@emailthing.xyz",
                name: "EmailThing System"
            },
            subject: "Reset your password on EmailThing",
            content: [
                {
                    type: "text/plain",
                    value:
                        `Hello @${user.username},

You have requested to reset your password on EmailThing. Click the link below to reset your password:

https://emailthing.xyz/login/reset?token=${token}

If you did not request this, please ignore this email.`
                }
            ]
        }),
    })

    if (!e.ok) {
        console.error(await e.text())
        return { error: "Failed to send email" }
    }

}

export async function resetPasswordWithToken(token: string, password: string) {
    const reset = await db.query.ResetPasswordToken.findFirst({
        where: and(
            eq(ResetPasswordToken.token, token),
            gt(ResetPasswordToken.expiresAt, new Date())
        ),
        columns: {
            userId: true,
        }
    })

    if (!reset) {
        return { error: "Invalid token" }
    }

    await db.batch([
        db.update(User)
            .set({
                password: await createPasswordHash(password)
            })
            .where(eq(User.id, reset.userId)),

        db.delete(ResetPasswordToken)
            .where(eq(ResetPasswordToken.token, token)),
    ])

    return redirect("/login")
}