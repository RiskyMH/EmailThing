'use server'

import { getCurrentUser } from "@/utils/jwt"
import { createPasswordHash, verifyPassword } from "@/utils/password"
import prisma from "@/utils/prisma"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import webpush from 'web-push';
import { env } from '@/utils/env';

export async function changeUsername(username: string) {
    const userId = await getCurrentUser()
    if (!userId) return

    // check if taken (but not by the user)
    const existingUser = await prisma.user.findFirst({
        where: {
            username,
            NOT: {
                id: userId
            }
        }
    })

    if (existingUser) return { error: 'Username already taken' }

    // update username
    await prisma.user.update({
        where: { id: userId },
        data: { username }
    })

    revalidatePath('/settings')
}

export async function changePassword(oldPassword: string, newPassword: string) {
    const userId = await getCurrentUser()
    if (!userId) return

    // check old password
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return { error: 'User not found' }

    const validPassword = verifyPassword(oldPassword, user.password)
    if (!validPassword) return { error: 'Current password is not correct' }

    // update password
    await prisma.user.update({
        where: { id: userId },
        data: {
            password: await createPasswordHash(newPassword)
        }
    })

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


    await prisma.userNotification.create({
        data: {
            userId,
            endpoint: subscription.endpoint,
            expiresAt: subscription.expirationTime ? new Date(subscription.expirationTime) : undefined,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth
        }
    })
}

export async function deleteSubscription(endpoint: string) {
    const userId = await getCurrentUser();
    if (!userId) throw new Error("User not found");

    // delete subscription
    if (!endpoint) throw new Error("Subscription endpoint is missing");

    await prisma.userNotification.delete({
        where: {
            userId,
            endpoint: endpoint
        }
    })

    revalidatePath('/settings')
}