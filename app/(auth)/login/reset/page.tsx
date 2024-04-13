import { Metadata } from "next"
import Link from "next/link"
// import Logo from "@/icons/Logo"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/utils/tw"
import { ChevronLeft, MailIcon } from "lucide-react"
import { UserAuthForm } from "./form.client"
import { db, ResetPasswordToken } from "@/db"
import { notFound } from "next/navigation"
import { and, eq, gt } from "drizzle-orm"

export const revalidate = 0

export default async function LoginPage({
    searchParams
}: {
    searchParams: {
        token: string
    }
}) {

    const token = await db.query.ResetPasswordToken.findFirst({
        where: and(
            eq(ResetPasswordToken.token, searchParams.token),
            gt(ResetPasswordToken.expiresAt, new Date())
        ),
        columns: {
            token: true,
        },
        with: {
            user: {
                columns: {
                    username: true
                }
            }
        }
    })

    if (!token) return notFound();

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
                    <MailIcon className="mx-auto h-6 w-6" />
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Reset your password
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Enter the password you wish to use now
                    </p>
                </div>

                {/* the actual login part */}
                <UserAuthForm username={token.user.username} token={token.token} />

                <p className="px-8 text-center text-sm text-muted-foreground flex flex-col gap-2">
                    <Link
                        href="/login"
                        className="hover:text-muted-foreground underline underline-offset-4"
                    >
                        Remember your password? Sign In
                    </Link>

                </p>

            </div>
        </div>
    )
}

export const metadata = {
    title: "Reset Password",
    description: "Login to your account",
    robots: {
        index: false,
        follow: false,
    }
} satisfies Metadata
