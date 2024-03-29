'use server'

import { getCurrentUser } from "@/utils/jwt"
import { createPasswordHash, verifyPassword } from "@/utils/password"
import { db, User, UserNotification } from "@/db";
import { and, eq, not } from "drizzle-orm";
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import webpush from 'web-push';
import { env } from '@/utils/env';
import { userAuthSchema } from "@/validations/auth"

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

    const validPassword = verifyPassword(oldPassword, user.password)
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


webpush.setVapidDetails(
    'mailto:test@example.com',
    env.NEXT_PUBLIC_NOTIFICATIONS_PUBLIC_KEY,
    env.WEB_NOTIFICATIONS_PRIVATE_KEY
)

export async function saveSubscription(subscription: PushSubscriptionJSON) {
    const userId = await getCurrentUser();
    if (!userId) throw new Error("User not found");

    // save subscription
    if (!subscription.keys) throw new Error("Subscription keys are missing");
    if (!subscription.endpoint) throw new Error("Subscription endpoint is missing");

    await webpush.sendNotification({
        endpoint: subscription.endpoint,
        keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
        }
    }, JSON.stringify({
        title: "Text Notification",
        body: "This is a test notification!",
    }))

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