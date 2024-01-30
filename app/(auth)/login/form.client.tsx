"use client"

import { cn } from "@/app/utils/tw"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import signIn from "./action"
import { FormEvent, useTransition } from "react"

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> { }


export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
    const [isPending, startTransition] = useTransition();

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        // @ts-ignore - the types seem to be wrong with async
        startTransition(async () => {
            const formData = new FormData(event.target as HTMLFormElement)
            const signInResult = await signIn(formData)

            if (signInResult?.error) {
                return toast.error(signInResult.error)
            }

            return toast.success("Welcome back!")
        });
    }

    return (
        <div className={cn("grid gap-6", className)} {...props}>
            <form action={signIn} onSubmit={onSubmit}>
                <div className="grid gap-2">
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
                            className="bg-secondary border-none"
                            disabled={isPending}
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
                            className="bg-secondary border-none"
                            disabled={isPending}
                        />
                    </div>

                    <Button disabled={isPending}>
                        {isPending && (
                            <Loader2 className="me-2 h-4 w-4 animate-spin" />
                        )}
                        Sign In
                    </Button>
                </div>
            </form>

        </div>
    )
}
