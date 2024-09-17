import { Metadata } from "next"
import Link from "next/link"
// import Logo from "@/icons/Logo"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/utils/tw"
import { ChevronLeft, MailIcon } from "lucide-react"
import { UserAuthForm } from "./form.client"
import Logo from "@/components/logo"

export const dynamic = 'force-dynamic'

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
                <ChevronLeft className="me-2 size-4" />
                Home
            </Link>

            <div className="mx-auto flex w-full flex-col justify-center gap-6 sm:w-[350px]">
                <div className="flex flex-col gap-2 text-center">
                    <Logo className="mx-auto size-10" />
                    {/* <MailIcon className="mx-auto size-6" /> */}
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Welcome back
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Enter your username to sign in to your email
                    </p>
                </div>

                {/* the actual login part */}
                <UserAuthForm />

            </div>
            <script type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebSite",
                        "description": "Login to your account",
                    })
                }} />
        </div>
    )
}

export const metadata = {
    title: "Login",
    description: "Login to your account",
    robots: {
        // index: false,
        // follow: false,
    },
    alternates: {
        canonical: "https://emailthing.xyz/login",
    },
} satisfies Metadata
