"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { cn } from "@/app/utils/tw"
import { userAuthSchema } from "@/app/validations/auth"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { toast } from "@/app/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import signIn from "./action"
import { useState } from "react"

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> { }

type AuthFormData = z.infer<typeof userAuthSchema>

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AuthFormData>({
        resolver: zodResolver(userAuthSchema),
    })
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const getCallbackUrl = () => new URL(window.location.href).searchParams?.get("from")

    async function onSubmit(data: AuthFormData) {
        setIsLoading(true)
        const signInResult = await signIn(data.username, data.password, getCallbackUrl())

        
        if (signInResult?.error) {
            setIsLoading(false)
            return toast({
                title: signInResult.error,
                variant: "destructive",
            })
        }

        return toast({
            title: "Success!",
            description: "You have successfully signed in",
        })
    }

    return (
        <div className={cn("grid gap-6", className)} {...props}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid gap-2">
                    <div className="grid gap-1">
                        <Label className="sr-only" htmlFor="email">
                            Username 
                        </Label>
                        <Input
                            id="username"
                            placeholder="Username"
                            type="text"
                            autoCapitalize="none"
                            autoComplete="username"
                            autoCorrect="off"
                            disabled={isLoading}
                            {...register("username")}
                        />
                        {errors?.username && (
                            <p className="px-1 text-xs text-red-600">
                                {errors.username.message}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-1">
                        <Label className="sr-only" htmlFor="email">
                            Password
                        </Label>
                        <Input
                            id="password"
                            placeholder="*******"
                            type="password"
                            autoComplete="password"
                            autoCorrect="off"
                            disabled={isLoading}
                            {...register("password")}
                        />
                        {errors?.password && (
                            <p className="px-1 text-xs text-red-600">
                                {errors.password.message}
                            </p>
                        )}
                    </div>

                    <Button disabled={isLoading}>
                        {isLoading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Sign In
                    </Button>
                </div>
            </form>

        </div>
    )
}
