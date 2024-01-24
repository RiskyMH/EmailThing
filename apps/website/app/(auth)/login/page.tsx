import { Metadata } from "next"
import Link from "next/link"
// import Logo from "@/app/icons/Logo"
import { buttonVariants } from "@/app/components/ui/button"
import { cn } from "@/app/utils/tw"
import { ChevronLeft, MailIcon } from "lucide-react"
import { UserAuthForm } from "./form.client"

export default async function LoginPage() {

    return (
        <div className="container flex min-h-screen h-screen w-screen flex-col items-center justify-center bg-background">
            <Link
                href="/home"
                className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "absolute left-4 top-4 md:left-8 md:top-8"
                )}
            >
                <ChevronLeft className="me-2 h-4 w-4" />
                Back
            </Link>

            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                <div className="flex flex-col space-y-2 text-center">
                    {/* <Logo className="mx-auto h-6 w-6" /> */}
                    <MailIcon className="mx-auto h-6 w-6" />
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Welcome back
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Enter your username to sign in to your email
                    </p>
                </div>

                {/* the actual login part */}
                <UserAuthForm />

                <p className="px-8 text-center text-sm text-muted-foreground flex flex-col space-y-2">
                    <Link
                        // href="/register"
                        href="#register"
                        className="hover:text-brand underline underline-offset-4"
                    >
                        Don&apos;t have an account? Sign Up
                    </Link>
                    {/* <Link
                            // href="/login/forgot"
                            href="#forgot"
                            className="hover:text-brand underline underline-offset-4"
                        >
                            Forgot password?
                        </Link> */}

                </p>
            </div>
        </div>
    )
}

export const metadata = {
    title: "Login",
    description: "Login to your account",
    robots: {
        index: false,
        follow: false,
    }
} satisfies Metadata
