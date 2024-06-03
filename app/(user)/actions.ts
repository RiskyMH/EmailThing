'use server'

import { getCurrentUser, removeToken } from "@/utils/jwt"
import { createPasswordHash, verifyPassword } from "@/utils/password"
import { db, PasskeyCredentials, User, UserNotification } from "@/db";
import { and, eq, not } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { sendNotification } from "@/utils/web-push";
import { userAuthSchema } from "@/validations/auth"
import { env } from "@/utils/env";
import { verifyCredentials } from "@/utils/passkeys";
import { impersonatingEmails } from "@/validations/invalid-emails";


export async function changeUsername(_prevState: any, data: FormData) {
    const userId = await getCurrentUser()
    if (!userId) return
    const username = data.get("new-name") as string

    // check if taken (but not by the user)
    const existingUser = await db.query.User.findFirst({
        where: and(
            eq(User.username, username),
            not(eq(User.id, userId))
        )
    })

    if (existingUser) return { error: 'Username already taken' }

    // check schema
    const validUsername = userAuthSchema.safeParse({ username, password: "password" })
    if (!validUsername.success) return { error: validUsername.error.errors[0].message }

    if (impersonatingEmails.some(v => validUsername.data.username.includes(v))) {
        const user = await db.query.User.findFirst({
            where: eq(User.id, userId),
            columns: {
                admin: true
            }
        })
        if (!user?.admin) {
            return { error: "Invalid username" }
        }
    }

    // update username
    await db.update(User)
        .set({ username })
        .where(eq(User.id, userId))
        .execute()

    revalidatePath('/settings')
    return { success: "Your username has been updated." }
}

export async function changePassword(_prevState: any, data: FormData) {
    const userId = await getCurrentUser()
    if (!userId) return

    const oldPassword = data.get("password") as string
    const newPassword = data.get("new-password") as string

    // check old password
    const user = await db.query.User.findFirst({
        where: eq(User.id, userId),
        columns: {
            password: true
        }
    })

    if (!user) return { error: 'User not found' }

    const validPassword = await verifyPassword(oldPassword, user.password)
    if (!validPassword) return { error: 'Current password is not correct' }

    if (newPassword.length < 8) return { error: 'Password needs to be at least 8 characters' }

    // update password
    await db.update(User)
        .set({
            password: await createPasswordHash(newPassword)
        })
        .where(eq(User.id, userId))
        .execute()

    revalidatePath('/settings')
    return { success: "Your password has been updated." }
}


export async function logout() {
    removeToken()
    cookies().delete('mailboxId')

    redirect("/login")
}

export async function changeBackupEmail(_prevState: any, data: FormData, redirectHome = false) {
    const userId = await getCurrentUser()
    if (!userId) return

    const email = data.get("email") as string

    const user = await db.query.User.findFirst({
        where: eq(User.id, userId),
        columns: {
            id: true,
            backupEmail: true,
            username: true,
            email: true
        }
    })

    if (!user) throw new Error("User not found")

    const e = await fetch("https://email.riskymh.workers.dev", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-auth": env.EMAIL_AUTH_TOKEN
        } as Record<string, string>,
        body: JSON.stringify({
            personalizations: [
                {
                    to: [{ email }]
                },
            ],
            from: {
                email: "system@emailthing.xyz",
                name: "EmailThing System"
            },
            subject: "Someone has added you as a backup email! 🎉",
            content: [
                {
                    type: "text/plain",
                    value:
                        `Hello!

${user.username} has added you as a backup email on EmailThing! 🎉

This means that if they ever lose access to their account, they can use this email to recover it.

If you did not expect this email or have any questions, please contact us at contact@emailthing.xyz
`
                }
            ]
        }),
    })

    if (!e.ok) {
        console.error(await e.text())
        return { error: "Failed to send test email to your email address" }
    }

    await db.update(User)
        .set({
            backupEmail: email,
            onboardingStatus: { initial: true }
        })
        .where(eq(User.id, userId))
        .execute()

    revalidateTag(`user-${userId}`)
    revalidatePath('/settings')

    if (redirectHome) redirect("/mail")
    return { success: "Your backup email has been updated." }
}


export async function addPasskey(creds: Credential, name: string) {
    const userId = await getCurrentUser()
    if (!userId) return
    try {
        const { credentialID, publicKey } = await verifyCredentials(userId, creds);

        await db.insert(PasskeyCredentials)
            .values({
                userId,
                name,
                publicKey: publicKey,
                credentialId: credentialID
            })
    } catch (err) {
        console.error(err)
        return { error: "Failed to verify passkey" }
    }

    revalidatePath("/settings")
}

export async function deletePasskey(passkeyId: string) {
    const userId = await getCurrentUser()
    if (!userId) return

    await db.delete(PasskeyCredentials)
        .where(and(
            eq(PasskeyCredentials.id, passkeyId),
            eq(PasskeyCredentials.userId, userId)
        ))
        .execute()

    revalidatePath("/settings")
}

export async function changeEmail(_prevState: any, data: FormData) {
    const userId = await getCurrentUser()
    if (!userId) return

    await db.update(User)
        .set({
            email: data.get("email") as string,
        })
        .where(eq(User.id, userId))
        .execute()

    revalidateTag(`user-${userId}`)
    revalidatePath("/settings")
    return { success: "Your email has been updated." }
}
