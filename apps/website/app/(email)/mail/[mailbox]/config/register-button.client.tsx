'use client'

import { useEffect, useState, useTransition } from 'react'
import { resetServiceWorker } from '@/app/utils/service-worker'
import { env } from '@/app/utils/env'
import { Button } from '@/app/components/ui/button'
import { saveSubscription } from './actions'
import { toast } from '@/app/components/ui/use-toast'
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
            return toast({
                description: 'Notifications are not supported on this device',
                variant: 'destructive',
            });
        }

        if (window?.Notification?.permission === "denied") {
            return toast({
                description: 'You have denied notifications',
                variant: 'destructive',
            });
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

        toast({
            description: 'You have successfully subscribed to notifications',
        });

    } catch (err) {
        console.error('Error', err)

        return toast({
            description: 'Failed to subscribe to notifications',
            variant: 'destructive',
        });
    }
}
