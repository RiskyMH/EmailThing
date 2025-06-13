import { CardDescription, CardTitle } from "@/components/ui/card";


export default function UserSettingsNotifications() {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <CardTitle className="text-2xl">Notifications</CardTitle>
        <CardDescription>Enable and configure your notifications.</CardDescription>
      </div>

      <NotificationsButton />
    </>
  );
}

("use client");

import { Button } from "@/components/ui/button";
import { registerServiceWorker } from "@/utils/service-worker";
import { Loader2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { sha } from "../layout";
import changeUserSettings from "./_api";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/utils/data/db";
import { getLogedInUserApi } from "@/utils/data/queries/user";
import { Title } from "@/components/title";

const deleteSubscription = async (endpoint: string) => {
  return changeUserSettings("delete-notification", {
    endpoint,
  });
};

const saveSubscription = async (subscription: PushSubscriptionJSON) => {
  return changeUserSettings("save-notification", {
    subscription,
  });
};

const notificationsSupported = () =>
  "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;

export function NotificationsButton() {
  const [isPending, startTransition] = useTransition();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const sync = useLiveQuery(
    (async () => {
      let sync = await getLogedInUserApi();
      if (sync?.tokenNeedsRefresh) {
        await db.refreshToken();
        sync = await getLogedInUserApi();
      }
      return sync;
    }), []);
  const options: PushSubscriptionOptionsInit = {
    applicationServerKey: sync?.notificationsPublicKey,
    userVisibleOnly: true,
  };

  useEffect(() => {
    setIsLoaded(!!sync?.notificationsPublicKey);
    if (notificationsSupported()) {
      navigator.serviceWorker.ready.then(async (swRegistration) => {
        const subscription = await swRegistration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      });
    }
  }, [sync?.notificationsPublicKey]);

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

      const res = await saveSubscription(subscription.toJSON());
      if ("error" in res) {
        return void toast.error(res.error || "Failed to subscribe to notifications");
      }
      setIsSubscribed(true);
      toast(res.success, { description: res.description });
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
        const res = await deleteSubscription(subscription.endpoint);
        if ("error" in res) {
          console.error({ res });
          return void toast.error(res.error || "Failed to unsubscribe from notifications");
        }
        setIsSubscribed(false);
        toast(res.success);
      } catch (err) {
        console.error("Error", err);
        return void toast.error("Failed to unsubscribe to notifications");
      }
    });
  };

  return (
    <>
      <Title title="Notifications • User Settings • EmailThing" />
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
    </>
  );
}
