import { CardDescription, CardTitle } from "@/components/ui/card";

// TODO: temp solution for being weird - fix later
globalThis.process ||= { env: {} }
const PUBLIC_KEY = process.env.NEXT_PUBLIC_NOTIFICATIONS_PUBLIC_KEY

export default function UserSettingsNotifications() {
    return (
        <>
            <div className="flex flex-col gap-1.5">
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Enable and configure your notifications.</CardDescription>
            </div>

            {/* todo: get this from the server at login time or something - but not hardcoded here */}
            <NotificationsButton publicKey={PUBLIC_KEY} />
        </>
    )
}


"use client";

import { Button } from "@/components/ui/button";
import { registerServiceWorker, unregisterServiceWorkers } from "@/utils/service-worker";
import { Loader2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { sha } from "../layout";

const deleteSubscription = async (endpoint: string) => {
    toast.info("todo")
}

const saveSubscription = async (subscription: PushSubscriptionJSON) => {
    toast.info("todo")
}

const notificationsSupported = () =>
    "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;

export function NotificationsButton({ publicKey }: { publicKey: string }) {
    const [isPending, startTransition] = useTransition();
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);

    const options: PushSubscriptionOptionsInit = {
        applicationServerKey: publicKey,
        userVisibleOnly: true,
    };

    useEffect(() => {
        setIsLoaded(true);
        if (notificationsSupported()) {
            navigator.serviceWorker.ready.then(async (swRegistration) => {
                const subscription = await swRegistration.pushManager.getSubscription();
                setIsSubscribed(!!subscription);
            });
        }
    }, []);

    const requestPermission = async () => {
        if (!notificationsSupported()) {
            return toast.error("Notifications are not supported on this device");
        }

        if (window?.Notification?.permission === "denied") {
            return toast.error("You have denied notifications");
        }

        startTransition(async () => {
            const receivedPermission = await window?.Notification.requestPermission();

            if (receivedPermission === "granted") {
                await subscribe();
            }
        });
    };

    const subscribe = async (tryAgain = true) => {
        const swRegistration = await registerServiceWorker(sha || undefined);

        try {
            if (!swRegistration?.active) return void (await subscribe(false));
            const subscription = await swRegistration.pushManager.subscribe(options);

            await saveSubscription(subscription.toJSON());
            setIsSubscribed(true);
            toast("You have successfully subscribed to notifications");
        } catch (err) {
            console.error("Error", err);
            return toast.error("Failed to subscribe to notifications");
        }
    };

    const unSubscribe = () => {
        startTransition(async () => {
            const swRegistration = (await navigator.serviceWorker.ready).pushManager;

            try {
                const subscription = await swRegistration.getSubscription();
                if (!subscription) return void toast("You are not subscribed to notifications");

                await subscription.unsubscribe();
                // await unregisterServiceWorkers();
                await deleteSubscription(subscription.endpoint);
                setIsSubscribed(false);
                toast("Unsubscribed from notifications");
            } catch (err) {
                console.error("Error", err);
                return void toast.error("Failed to unsubscribe to notifications");
            }
        });
    };

    return (
        <Button
            onClick={() => (isSubscribed ? unSubscribe() : requestPermission())}
            disabled={isPending || !isLoaded}
            className="flex w-min gap-2"
            // variant={isSubscribed ? "destructive" : "secondary"}
            variant="default"
        >
            {isPending && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
            {isSubscribed ? "Disable notifications" : "Enable notifications"}
        </Button>
    );
}
