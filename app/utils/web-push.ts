import "server-only";
import { type PushMessage, type PushSubscription, type VapidKeys, buildPushPayload } from "@block65/webcrypto-web-push";
import { env } from "./env";

const vapid: VapidKeys = {
    subject: "mailto:notifications@emailthing.app",
    publicKey: env.NEXT_PUBLIC_NOTIFICATIONS_PUBLIC_KEY,
    privateKey: env.WEB_NOTIFICATIONS_PRIVATE_KEY,
};

export async function sendNotification({ data, subscription }: { data: string; subscription: PushSubscription }) {
    const message: PushMessage = { data };
    const payload = await buildPushPayload(message, subscription, vapid);
    return fetch(subscription.endpoint, payload);
}
