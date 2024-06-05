'use client'

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { emailMeForm } from "./action";

export function Form({ children, className, publicEmail }: { children: ReactNode, className?: string, publicEmail?: string }) {
    const [state, formAction] = useFormState(emailMeForm, {})

    return (
        <form action={formAction} className={className}>
            {children}
            <div className="flex mt-2 sm:mt-1 sm:h-10 items-center flex-col-reverse sm:flex-row gap-3">
                {state?.error ? (
                    <p className="text-red justify-center text-sm">
                        {state.error}
                    </p>
                ) : (
                    <p className="text-muted-foreground justify-center text-sm overflow-auto">
                        You can also email <a href={`mailto:${publicEmail}`} className="font-bold hover:underline">{publicEmail}</a>
                    </p>
                )}
                <SendButton />
            </div>
            <Toaster message={state?.success} />
        </form >
    );
}

function SendButton() {
    const state = useFormStatus()
    return (
        <Button type="submit" className="w-full sm:w-min sm:ms-auto px-7 flex gap-2" disabled={state.pending} >
            {state.pending && <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />}
            Send Message
        </Button>
    )
}

function Toaster({ message }: { message?: string }) {
    const state = useFormStatus()
    useEffect(() => {
        if (!state.pending && message) {
            toast.success(message)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.pending])
    return <></>
}
