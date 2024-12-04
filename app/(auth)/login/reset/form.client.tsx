"use client";

import DisableFormReset from "@/components/disable-reset.client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/tw";
import { Loader2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { resetPasswordWithToken } from "../action";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
    username: string;
    token: string;
}

export function UserAuthForm({ className, username, token, ...props }: UserAuthFormProps) {
    const [isPending, startTransition] = useTransition();

    async function onSubmit(data: FormData) {
        startTransition(async () => {
            const signInResult = await resetPasswordWithToken(token, data.get("password") as string);

            if (signInResult?.error) {
                return void toast.error(signInResult.error);
            }

            return void toast.success("Now login with your new password!");
        });
    }

    return (
        <>
            <div className={cn("grid gap-6", className)} {...props}>
                <form action={onSubmit} className="grid gap-2" id="reset-pwd-form">
                    <div className="grid gap-1">
                        <Label className="sr-only" htmlFor="email">
                            Username
                        </Label>
                        <Input
                            id="username"
                            name="username"
                            placeholder="Username"
                            type="text"
                            autoCapitalize="none"
                            autoComplete="username"
                            autoCorrect="off"
                            className="border-none bg-secondary"
                            readOnly
                            value={username}
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label className="sr-only" htmlFor="email">
                            Password
                        </Label>
                        <Input
                            id="password"
                            name="password"
                            placeholder="*******"
                            type="password"
                            autoComplete="password"
                            autoCorrect="off"
                            className="border-none bg-secondary"
                            disabled={isPending}
                        />
                    </div>

                    <Button disabled={isPending} type="submit">
                        {isPending && <Loader2 className="me-2 size-4 animate-spin" />}
                        Sign In
                    </Button>
                    <DisableFormReset formId="reset-pwd-form" />
                </form>
            </div>
        </>
    );
}
