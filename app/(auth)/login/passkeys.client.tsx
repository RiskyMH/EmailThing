'use client'

import { useEffect, useState, type TransitionStartFunction } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/utils/tw";
import { Loader2Icon, KeyRoundIcon } from "lucide-react";
import { toast } from "sonner";
import { signInPasskey } from "./action";
import { get, parseRequestOptionsFromJSON, supported } from "@github/webauthn-json/browser-ponyfill";
import { useRouter } from "next/navigation";

export default function PasskeysLogin({ transition, challenge = "login" }: { transition: [boolean, TransitionStartFunction], challenge?: string }) {
    const [isPending, startTransition] = transition
    const [support, setSupport] = useState(false);
    useEffect(() => {
        setSupport(supported());
    }, []);

    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleLogin = async (event: any) => {
        event.preventDefault();
        setLoading(true)
        startTransition(async () => {
            try {
                const credential = await get(
                    parseRequestOptionsFromJSON({
                        publicKey: {
                            challenge: Buffer.from(challenge).toString('base64'),
                            timeout: 60000,
                            userVerification: "required",
                            rpId: window.location.hostname,
                        }
                    }),
                );
                // const credential = await navigator.credentials.get({
                //     publicKey: {
                //         challenge: Buffer.from(challenge),
                //         timeout: 60000,
                //         userVerification: "required",
                //         rpId: window.location.hostname,
                //     },
                // });

                if (!credential) {
                    setLoading(false)
                    return void toast.error("No passkey")
                }


                const signInResult = await signInPasskey(credential)

                if (signInResult?.error) {
                    setLoading(false)
                    return void toast.error(signInResult.error)
                }

                setLoading(false)
                toast.success("Welcome back!")
                router.refresh()
            } catch (err) {
                console.error(err)
                setLoading(false)
                return void toast.error("Failed to sign in with passkey")
            }
        })
    }

    return (
        <button
            type="button"
            className={cn(buttonVariants({ variant: "secondary", className: "gap-2" }))}
            onClick={handleLogin}
            disabled={isPending || !support}
        >
            {loading ? (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <KeyRoundIcon className="mr-2 h-4 w-4" />
            )}
            Passkey
        </button>

    )

}