"use client"

import { cn } from "@/utils/tw"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import signUp from "./action"
import { FormEvent, useTransition } from "react"
import { useRouter } from "next/navigation"

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> { }


export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter()

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        startTransition(async () => {
            const formData = new FormData(event.target as HTMLFormElement)
            const signUpResult = await signUp(formData)

            if (signUpResult?.error) {
                return void toast.error(signUpResult.error)
            }

            toast.success("Welcome!")
            router.refresh()
        });
    }

    return (
        <div className={cn("grid gap-6", className)} {...props}>
            <form action={signUp} onSubmit={onSubmit}>
                <div className="grid gap-2">
                    <div className="grid gap-1">
                        <Label className="sr-only" htmlFor="email">
                            Username
                        </Label>
                        <div
                            className={cn("group h-10 w-full py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 bg-secondary rounded flex self-center px-3 gap-2", isPending && "cursor-not-allowed opacity-50")}
                        >
                            <input
                                id="username"
                                name="username"
                                placeholder="Username"
                                type="text"
                                autoCapitalize="none"
                                autoComplete="new-password"
                                autoCorrect="off"
                                className="w-full focus-visible:outline-none bg-transparent"
                                disabled={isPending}
                                required
                            />
                            <span>
                                @emailthing.xyz
                            </span>
                        </div>
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
                            autoComplete="new-password"
                            autoCorrect="off"
                            className="bg-secondary border-none"
                            disabled={isPending}
                            required
                        />
                    </div>

                    <Button disabled={isPending} type="submit">
                        {isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                        Register
                    </Button>
                </div>
            </form>

        </div>
    )
}
