"use server";

import { getCurrentUser } from "@/app/utils/user";
import { prisma } from "@email/db";

export async function saveSubscription(mailboxId: string, subscription: PushSubscriptionJSON) {
    const userId = await getCurrentUser();
    if (!userId) throw new Error("User not found");

    // check if user has access to mailbox
    const mailbox = await prisma.mailbox.findFirst({
        where: {
            id: mailboxId,
            users: {
                some: {
                    userId,
                }
            }
        },
        select: {
            id: true,
        }
    });

    if (!mailbox) throw new Error("Mailbox not found");

    // save subscription
    console.log(subscription);
    if (!subscription.keys) throw new Error("Subscription keys are missing");
    if (!subscription.endpoint) throw new Error("Subscription endpoint is missing");

    await prisma.mailboxNotification.create({
        data: {
            mailboxId: mailbox.id,
            endpoint: subscription.endpoint,
            expiresAt: subscription.expirationTime ? new Date(subscription.expirationTime) : undefined,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth
        }
    })
}

