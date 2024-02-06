import { Metadata } from "next"
import Link from "next/link"
// import Logo from "@/icons/Logo"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/utils/tw"
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
                Home
            </Link>

            <div className="mx-auto flex w-full flex-col justify-center gap-6 sm:w-[350px]">
                <div className="flex flex-col gap-2 text-center">
                    {/* <Logo className="mx-auto h-6 w-6" /> */}
                    <MailIcon className="mx-auto h-6 w-6" />
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Welcome to EmailThing
                    </h1>
                    {/* <p className="text-sm text-muted-foreground">
                        Choose an username and password to create an account
                    </p> */}
                    <p className="text-sm text-muted-foreground">
                        Currently you need an invite code, please {" "}
                        <a href="mailto:emailthing@riskymh.dev" className="font-bold hover:underline" target="_blank" rel="noreferrer">email me</a>
                        {" "} or ask on{" "}
                        <a href="https://discord.gg/GT9Q2Yz4VS" className="font-bold hover:underline" target="_blank" rel="noreferrer">Discord</a>
                        {" "} for an invite code.
                    </p>
                </div>

                {/* the actual form part */}
                <UserAuthForm />

                <p className="px-8 text-center text-sm text-muted-foreground flex flex-col gap-2">
                    <Link
                        href="/login"
                        className="hover:text-brand underline underline-offset-4"
                    >
                        Already have an account? Sign In
                    </Link>

                </p>
            </div>
        </div>
    )
}

export const metadata = {
    title: "Register",
    description: "Register for an account",
    robots: {
        index: false,
        follow: false,
    }
} satisfies Metadata
