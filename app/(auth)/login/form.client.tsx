"use client"

import { cn } from "@/utils/tw"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { KeyRoundIcon, Loader2, Loader2Icon } from "lucide-react"
import signIn, { resetPassword } from "./action"
import { FormEvent, useState, useTransition } from "react"
import Link from "next/link"
import { SmartDrawer, SmartDrawerClose, SmartDrawerContent, SmartDrawerDescription, SmartDrawerFooter, SmartDrawerHeader, SmartDrawerTitle, SmartDrawerTrigger } from "@/components/ui/smart-drawer"
import PasskeysLogin from "./passkeys.client"

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> { }


export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
    const [isPending, startTransition] = useTransition();
    const [hadAnError, setHadAnError] = useState<false | string>(false)
    const [loading, setLoading] = useState(false)

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        startTransition(async () => {
            const formData = new FormData(event.target as HTMLFormElement)
            const signInResult = await signIn(formData)
            setLoading(false)

            if (signInResult?.error) {
                // @ts-expect-error yay types
                setHadAnError(event.target?.username?.value ?? "unknown")
                return void toast.error(signInResult.error)
            }

            return void toast.success("Welcome back!")
        });
    }

    return (
        <>
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

                        <Button disabled={isPending} type="submit">
                            {loading && (
                                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                            )}
                            Sign In
                        </Button>
                    </div>
                </form>
            </div>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t-2" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                    </span>
                </div>
            </div>
            <PasskeysLogin transition={[isPending, startTransition]} />
            <p className="px-8 text-center text-sm text-muted-foreground flex flex-col gap-2">
                <Link
                    href="/register"
                    className="hover:text-muted-foreground underline underline-offset-4"
                >
                    Don&apos;t have an account? Sign Up
                </Link>
                {hadAnError && <ResetPasswordDiag username={hadAnError} />}

            </p>
        </>
    )
}

function ResetPasswordDiag({ username }: { username: string }) {
    const [isPending, startTransition] = useTransition();

    const resetPasswordAction = async () => {
        startTransition(async () => {
            const res = await resetPassword(username)
            if (res?.error) {
                toast.error(res.error)
            } else {
                toast.success("Check your email for the reset link.")
                document.getElementById("smart-drawer:close")?.click()
            }
        })
    }

    return (
        <SmartDrawer>
            <SmartDrawerTrigger asChild>
                <a className="hover:text-muted-foreground underline underline-offset-4 cursor-pointer">
                    Forgot your password?
                </a>
            </SmartDrawerTrigger>
            <SmartDrawerContent className="sm:max-w-[425px]">
                <SmartDrawerHeader>
                    <SmartDrawerTitle>Reset your password</SmartDrawerTitle>
                    <SmartDrawerDescription>
                        We will send you an email the user <strong>{username}</strong>&lsquo;s back up email to reset your password.

                        Are you sure you want to continue?
                    </SmartDrawerDescription>
                </SmartDrawerHeader>
                <SmartDrawerFooter className="pt-2 flex">
                    <SmartDrawerClose className={buttonVariants({ variant: "secondary" })}>Close</SmartDrawerClose>
                    <Button onClick={resetPasswordAction} disabled={isPending} className="gap-2">
                        {isPending && (
                            <Loader2 className="me-2 h-4 w-4 animate-spin" />
                        )}
                        Continue
                    </Button>
                </SmartDrawerFooter>
            </SmartDrawerContent>
        </SmartDrawer>

    )
}

