"use server";

import db, { UserNotification } from "@/db";
import { getCurrentUser } from "@/utils/jwt";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function saveSubscription(subscription: PushSubscriptionJSON) {
    const userId = await getCurrentUser();
    if (!userId) throw new Error("User not found");

    // save subscription
    if (!subscription.keys) throw new Error("Subscription keys are missing");
    if (!subscription.endpoint) throw new Error("Subscription endpoint is missing");

    // const res = await sendNotification({
    //     subscription: subscription as any,
    //     data: JSON.stringify({
    //         title: "Text Notification",
    //         body: "This is a test notification!",
    //     })
    // })

    // if (!res.ok) throw new Error("Failed to send test notification: " + await res.text())

    await db
        .insert(UserNotification)
        .values({
            userId,
            endpoint: subscription.endpoint,
            expiresAt: subscription.expirationTime ? new Date(subscription.expirationTime) : undefined,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
        })
        .execute();
}

export async function deleteSubscription(endpoint: string) {
    const userId = await getCurrentUser();
    if (!userId) throw new Error("User not found");

    // delete subscription
    if (!endpoint) throw new Error("Subscription endpoint is missing");

    await db
        .delete(UserNotification)
        .where(and(eq(UserNotification.userId, userId), eq(UserNotification.endpoint, endpoint)))
        .execute();

    revalidatePath("/settings");
}
