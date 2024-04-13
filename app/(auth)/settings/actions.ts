'use server'

import { getCurrentUser } from "@/utils/jwt"
import { createPasswordHash, verifyPassword } from "@/utils/password"
import { db, User, UserNotification } from "@/db";
import { and, eq, not } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { sendNotification } from "@/utils/web-push";
import { userAuthSchema } from "@/validations/auth"
import { env } from "@/utils/env";


export async function changeUsername(username: string) {
    const userId = await getCurrentUser()
    if (!userId) return

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

    // update username
    await db.update(User)
        .set({ username })
        .where(eq(User.id, userId))
        .execute()

    revalidatePath('/settings')
}

export async function changePassword(oldPassword: string, newPassword: string) {
    const userId = await getCurrentUser()
    if (!userId) return

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
}


export async function logout() {
    const c = cookies()
    c.delete('token')
    c.delete('mailboxId')

    redirect("/login")
}


export async function saveSubscription(subscription: PushSubscriptionJSON) {
    const userId = await getCurrentUser();
    if (!userId) throw new Error("User not found");

    // save subscription
    if (!subscription.keys) throw new Error("Subscription keys are missing");
    if (!subscription.endpoint) throw new Error("Subscription endpoint is missing");

    const res = await sendNotification({
        subscription: subscription as any,
        data: JSON.stringify({
            title: "Text Notification",
            body: "This is a test notification!",
        })
    })

    if (!res.ok) throw new Error("Failed to send test notification: " + await res.text())


    await db.insert(UserNotification)
        .values({
            userId,
            endpoint: subscription.endpoint,
            expiresAt: subscription.expirationTime ? new Date(subscription.expirationTime) : undefined,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
        })
        .execute()
}

export async function deleteSubscription(endpoint: string) {
    const userId = await getCurrentUser();
    if (!userId) throw new Error("User not found");

    // delete subscription
    if (!endpoint) throw new Error("Subscription endpoint is missing");

    await db.delete(UserNotification)
        .where(and(
            eq(UserNotification.userId, userId),
            eq(UserNotification.endpoint, endpoint)
        ))
        .execute()

    revalidatePath('/settings')
}

export async function changeBackupEmail(email: string, redirectHome = false) {
    const userId = await getCurrentUser()
    if (!userId) return

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
        return { error: "Failed to send email" }
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
}
