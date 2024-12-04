import Logo from "@/components/logo";
// import Logo from "@/icons/Logo"
import { buttonVariants } from "@/components/ui/button";
import { ResetPasswordToken, db } from "@/db";
import { cn } from "@/utils/tw";
import { and, eq, gt } from "drizzle-orm";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UserAuthForm } from "./form.client";

export const dynamic = "force-static";

export default async function LoginPage(props: {
    searchParams: Promise<{
        token: string;
    }>;
}) {
    const searchParams = await props.searchParams;
    if (!searchParams.token) return notFound();

    const token = await db.query.ResetPasswordToken.findFirst({
        where: and(eq(ResetPasswordToken.token, searchParams.token), gt(ResetPasswordToken.expiresAt, new Date())),
        columns: {
            token: true,
        },
        with: {
            user: {
                columns: {
                    username: true,
                },
            },
        },
    });

    if (!token) return notFound();

    return (
        <div className="container flex h-screen min-h-screen w-screen flex-col items-center justify-center bg-background">
            <Link
                href="/home"
                className={cn(buttonVariants({ variant: "ghost" }), "absolute top-4 left-4 md:top-8 md:left-8")}
            >
                <ChevronLeft className="me-2 size-4" />
                Home
            </Link>

            <div className="mx-auto flex w-full flex-col justify-center gap-6 sm:w-[350px]">
                <div className="flex flex-col gap-2 text-center">
                    <Logo className="mx-auto size-10" />
                    {/* <MailIcon className="mx-auto size-6" /> */}
                    <h1 className="font-semibold text-2xl tracking-tight">Reset your password</h1>
                    <p className="text-muted-foreground text-sm">Enter the password you wish to use now</p>
                </div>

                {/* the actual login part */}
                <UserAuthForm username={token.user.username} token={token.token} />

                <p className="flex flex-col gap-2 px-8 text-center text-muted-foreground text-sm">
                    <Link href="/login" className="underline underline-offset-4 hover:text-muted-foreground">
                        Remember your password? Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}

export const metadata = {
    title: "Reset Password",
    description: "Login to your account",
    robots: {
        index: false,
        follow: false,
    },
} satisfies Metadata;
