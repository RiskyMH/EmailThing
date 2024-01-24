"use server";

import { getCurrentUser } from "@/app/utils/user";
import { prisma } from "@email/db";
import webpush from 'web-push';
import { env } from '@/app/utils/env';
import { userMailboxAccess } from "../tools";

webpush.setVapidDetails(
    'mailto:test@example.com',
    env.NEXT_PUBLIC_NOTIFICATIONS_PUBLIC_KEY,
    env.WEB_NOTIFICATIONS_PRIVATE_KEY
)

export async function saveSubscription(mailboxId: string, subscription: PushSubscriptionJSON) {
    const userId = await getCurrentUser();
    if (!userId) throw new Error("User not found");

    // check if user has access to mailbox
    if (!userId || !await userMailboxAccess(mailboxId, userId)) throw new Error("Mailbox not found");

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
        url: `/mail/${mailboxId}`,
    }))


    await prisma.mailboxNotification.create({
        data: {
            mailboxId,
            endpoint: subscription.endpoint,
            expiresAt: subscription.expirationTime ? new Date(subscription.expirationTime) : undefined,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth
        }
    })
}

