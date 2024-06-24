"use client"

import { useEffect, useState, useTransition } from 'react'
import { registerServiceWorker, resetServiceWorker, unregisterServiceWorkers } from '@/utils/service-worker'
import { env } from '@/utils/env'
import { Button } from '@/components/ui/button'
import { deleteSubscription, saveSubscription } from './actions'
import { toast } from "sonner"
import { Loader2, Trash2 } from 'lucide-react'

const notificationsSupported = () =>
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window

const options: PushSubscriptionOptionsInit = {
    applicationServerKey: env.NEXT_PUBLIC_NOTIFICATIONS_PUBLIC_KEY,
    userVisibleOnly: true,
}


export default function NotificationsButton() {
    const [isPending, startTransition] = useTransition();
    const [isLoaded, setIsLoaded] = useState(false)
    const [isSubscribed, setIsSubscribed] = useState(false)

    useEffect(() => {
        setIsLoaded(true)
        if (notificationsSupported()) {
            navigator.serviceWorker.ready.then(async (swRegistration) => {
                const subscription = await swRegistration.pushManager.getSubscription()
                setIsSubscribed(!!subscription)
            })
        }
    }, [])


    const requestPermission = async () => {
        if (!notificationsSupported()) {
            return toast.error('Notifications are not supported on this device');
        }

        if (window?.Notification?.permission === "denied") {
            return toast.error('You have denied notifications');
        }

        startTransition(async () => {
            const receivedPermission = await window?.Notification.requestPermission()

            if (receivedPermission === 'granted') {
                await subscribe()
            }
        })
    }

    const subscribe = async (tryAgain = true) => {
        const swRegistration = await registerServiceWorker()

        try {
            if (!swRegistration.active) return void await subscribe(false);
            const subscription = await swRegistration.pushManager.subscribe(options)

            await saveSubscription(subscription.toJSON())
            setIsSubscribed(true)
            toast('You have successfully subscribed to notifications');

        } catch (err) {
            console.error('Error', err);
            return toast.error('Failed to subscribe to notifications');
        }
    }


    const unSubscribe = () => {
        startTransition(async () => {

            const swRegistration = (await navigator.serviceWorker.ready).pushManager

            try {
                const subscription = await swRegistration.getSubscription()
                if (!subscription) return void toast('You are not subscribed to notifications');

                await subscription.unsubscribe()
                await unregisterServiceWorkers()
                await deleteSubscription(subscription.endpoint)
                setIsSubscribed(false)
                toast('Unsubscribed from notifications');

            } catch (err) {
                console.error('Error', err)
                return void toast.error('Failed to unsubscribe to notifications');
            }
        })
    }

    return (
        <Button
            onClick={() => isSubscribed ? unSubscribe() : requestPermission()}
            disabled={isPending || !isLoaded}
            className='flex gap-2 w-min'
            // variant={isSubscribed ? "destructive" : "secondary"}
            variant="default"
        >
            {isPending && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
            {isSubscribed ? 'Disable notifications' : 'Enable notifications'}
        </Button>
    )
}

