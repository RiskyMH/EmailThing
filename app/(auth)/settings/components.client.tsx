'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changePassword, logout } from "./actions";
import { FormEvent, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";


export function ChangeSetting({ current, action }: { current: string, action: (value: string) => Promise<any> }) {
    const [isPending, startTransition] = useTransition();

    const formSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isPending) return;

        startTransition(async () => {
            // @ts-expect-error
            const res = await action(event.target.setting.value)
            if (res?.error) {
                toast.error(res.error)
            } else {
                document.getElementById("smart-drawer:close")?.click()
            }
        })

    }

    return (
        <form className="grid items-start gap-4 px-4 sm:px-0" onSubmit={formSubmit} autoComplete="off" >
            <Input className="bg-secondary border-none" name="setting" id="setting" autoFocus defaultValue={current} disabled={isPending} required />
            <Button type="submit" disabled={isPending} className="gap-2">
                {isPending && <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />}
                Save changes
            </Button>
        </form>
    );
}
export function ChangePassword() {
    const [isPending, startTransition] = useTransition();

    const formSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isPending) return;

        startTransition(async () => {
            // @ts-expect-error
            const res = await changePassword(event.target.password.value, event.target.newPassword.value)
            if (res?.error) {
                toast.error(res.error)
            } else {
                document.getElementById("smart-drawer:close")?.click()
            }
        })

    }

    return (
        <form className="grid items-start gap-4 px-4 sm:px-0" onSubmit={formSubmit} >
            <div className="grid gap-2">
                <Label htmlFor="password">Current password</Label>
                <Input
                    className="bg-secondary border-none"
                    name="password"
                    id="password"
                    autoFocus
                    disabled={isPending}
                    type="password"
                    required
                    autoComplete="password"
                />

                <Label htmlFor="newPassword">New password</Label>
                <Input
                    className="bg-secondary border-none"
                    name="newPassword"
                    id="newPassword"
                    disabled={isPending}
                    type="password"
                    required
                    autoComplete="new-password"
                />
            </div>
            <Button type="submit" disabled={isPending} className="gap-2">
                {isPending && <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />}
                Save changes
            </Button>
        </form>
    );
}

export function SignOut() {
    const [isPending, startTransition] = useTransition();

    const onClick = () => {
        if (isPending) return;
        startTransition(logout)
    }

    return (
        <Button variant="secondary" className="gap-2" onClick={onClick as any} disabled={isPending}>
            {isPending && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
            Sign out
        </Button>
    )
}
