"use client";

import DisableFormReset from "@/components/disable-reset.client";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { Input, type InputProps } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea, type TextareaProps } from "@/components/ui/textarea";
import { cn } from "@/utils/tw";
import type { SelectProps } from "@radix-ui/react-select";
import type { SwitchProps } from "@radix-ui/react-switch";
import { Loader2, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useId } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

export function CardForm({
    children,
    action,
    subtitle,
    disabled,
}: {
    children: ReactNode;
    action: (
        _prev: any,
        data: FormData,
    ) => Promise<
        | {
            error?: string;
            success?: string;
            description?: string;
        }
        | undefined
    >;
    subtitle?: string;
    disabled?: boolean;
}) {
    const [state, formAction] = useActionState(action, {});

    const id = useId();

    return (
        <form action={formAction} id={id}>
            {children}
            <CardFooter className="border-muted-foreground/30 border-t px-6 py-4">
                {state?.error ? (
                    <span className="text-red text-sm">{state.error}</span>
                ) : (
                    <span className="text-muted-foreground text-sm">{subtitle}</span>
                )}
                <SaveButton disabled={disabled} />
            </CardFooter>
            <Toaster message={state?.success} description={state?.description} />
            <DisableFormReset formId={id} />
        </form>
    );
}

function SaveButton({ disabled }: { disabled?: boolean }) {
    const state = useFormStatus();
    return (
        <Button type="submit" className="ms-auto flex gap-2" size="sm" disabled={disabled || state.pending}>
            {state.pending && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
            Save
        </Button>
    );
}

function Toaster({ message, description }: { message?: string; description?: string }) {
    const state = useFormStatus();
    useEffect(() => {
        if (!state.pending && message) {
            toast.success(message, { description });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.pending]);
    return <></>;
}

export function ClientSelect(props: SelectProps) {
    const state = useFormStatus();

    return (
        <Select {...props} disabled={props.disabled || state.pending}>
            {props.children}
        </Select>
    );
}

export function ClientInput(props: InputProps) {
    const state = useFormStatus();

    return <Input {...props} disabled={props.disabled || state.pending} />;
}

export function ClientTextarea(props: TextareaProps) {
    const state = useFormStatus();

    return <Textarea {...props} disabled={props.disabled || state.pending} />;
}

export function ClientSwitch(props: SwitchProps) {
    const state = useFormStatus();

    return state.pending ? (
        <div className={cn("flex gap-2", props.className)}>
            <Loader2 className="size-5 animate-spin self-center text-muted-foreground" />
            <Switch {...props} disabled={true} />
        </div>
    ) : (
        <Switch {...props} disabled={props.disabled} />
    );
}

export function MenuItem({ href, children }: { href: string; children: ReactNode }) {
    const pathname = usePathname();
    return (
        <Link href={href} className={pathname === href ? "font-semibold text-primary" : undefined}>
            {children}
        </Link>
    );
}
