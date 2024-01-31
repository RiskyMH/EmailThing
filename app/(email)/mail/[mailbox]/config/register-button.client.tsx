'use client'

import { useEffect, useState, useTransition } from 'react'
import { resetServiceWorker } from '@/utils/service-worker'
import { env } from '@/utils/env'
import { Button } from '@/components/ui/button'
import { saveSubscription } from './actions'
import { toast } from "sonner"
import { Loader2 } from 'lucide-react'

const notificationsSupported = () =>
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window

export default function Notifications({ mailbox }: { mailbox: string }) {
    const [isPending, startTransition] = useTransition();
    const [isLoaded, setIsLoaded] = useState(false)
    useEffect(() => setIsLoaded(true), [])


    const requestPermission = async () => {
        if (!notificationsSupported()) {
            return toast.error( 'Notifications are not supported on this device');
        }

        if (window?.Notification?.permission === "denied") {
            return toast.error('You have denied notifications');
        }

        // @ts-ignore - the types seem to be wrong with async
        startTransition(async () => {
            const receivedPermission = await window?.Notification.requestPermission()

            if (receivedPermission === 'granted') {
                await subscribe(mailbox)
            }
        })
    }

    return (
        <>
            <h3 className="text-lg">Notifications:</h3>
            <Button onClick={requestPermission} disabled={isPending || !isLoaded} className='flex gap-2'>
                {isPending && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                Subscribe
            </Button>
        </>
    )
}



const subscribe = async (mailbox: string) => {
    const swRegistration = await resetServiceWorker()

    try {
        const options: PushSubscriptionOptionsInit = {
            applicationServerKey: env.NEXT_PUBLIC_NOTIFICATIONS_PUBLIC_KEY,
            userVisibleOnly: true,
        }
        const subscription = await swRegistration.pushManager.subscribe(options)

        await saveSubscription(mailbox, subscription.toJSON())

        toast('You have successfully subscribed to notifications');

    } catch (err) {
        console.error('Error', err)

        return toast.error('Failed to subscribe to notifications');
    }
}
