'use client';

import { Button } from "@/components/ui/button";
import { Input, type InputProps } from "@/components/ui/input";
import { useEffect, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useFormState, useFormStatus } from "react-dom";
import { CardFooter } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import type { SelectProps } from "@radix-ui/react-select";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Textarea, type TextareaProps } from "@/components/ui/textarea";
import type { SwitchProps } from "@radix-ui/react-switch";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/utils/tw";


export function CardForm({ children, action, subtitle, disabled }: { children: ReactNode, action: (_prev: any, data: FormData) => Promise<{ error?: string, success?: string } | void>, subtitle?: string, disabled?: boolean }) {
    const [state, formAction] = useFormState(action, {})

    return (
        <form action={formAction}>
            {children}
            <CardFooter className="border-muted-foreground/30 border-t px-6 py-4">
                {state?.error ? (
                    <span className="text-sm text-red">
                        {state.error}
                    </span>
                ) : (
                    <span className="text-sm text-muted-foreground">
                        {subtitle}
                    </span>
                )}
                <SaveButton disabled={disabled} />
            </CardFooter>
            <Toaster message={state?.success} />
        </form>
    );
}

function SaveButton({ disabled }: { disabled?: boolean }) {
    const state = useFormStatus()
    return (
        <Button type="submit" className="ms-auto flex gap-2" size="sm" disabled={disabled || state.pending}>
            {state.pending && <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />}
            Save
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

export function ClientSelect(props: SelectProps) {
    const state = useFormStatus()

    return <Select {...props} disabled={props.disabled || state.pending}>{props.children}</Select>
}

export function ClientInput(props: InputProps) {
    const state = useFormStatus()

    return <Input {...props} disabled={props.disabled || state.pending} />
}

export function ClientTextarea(props: TextareaProps) {
    const state = useFormStatus()

    return <Textarea {...props} disabled={props.disabled || state.pending} />
}

export function ClientSwitch(props: SwitchProps) {
    const state = useFormStatus()

    return state.pending ? (<div className={cn("flex gap-2", props.className)}>
        <Loader2 className="w-5 h-5 self-center text-muted-foreground animate-spin" />
        <Switch {...props} disabled={true} />
    </div>) : <Switch {...props} disabled={props.disabled} />
}

export function MenuItem({ href, children }: { href: string, children: ReactNode }) {
    const pathname = usePathname()
    return (
        <Link href={href} className={pathname === href ? "font-semibold text-primary" : undefined}>
            {children}
        </Link>
    )
}
