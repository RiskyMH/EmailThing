import Logo from "@/components/logo";
// import Logo from "@/icons/Logo"
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/utils/tw";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { UserAuthForm } from "./form.client";

export const runtime = "edge";

export default async function LoginPage() {
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
                    <h1 className="font-semibold text-2xl tracking-tight">Welcome to EmailThing</h1>
                    {/* <p className="text-sm text-muted-foreground">
                        Choose an username and password to create an account
                    </p> */}
                    <p className="text-muted-foreground text-sm">
                        Currently you need an invite code, please{" "}
                        <a
                            href="mailto:emailthing@riskymh.dev"
                            className="font-bold hover:underline"
                            target="_blank"
                            rel="noreferrer"
                        >
                            email me
                        </a>{" "}
                        or ask on{" "}
                        <a
                            href="https://discord.gg/GT9Q2Yz4VS"
                            className="font-bold hover:underline"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Discord
                        </a>{" "}
                        for an invite code.
                    </p>
                </div>

                {/* the actual form part */}
                <UserAuthForm />

                <p className="flex flex-col gap-2 px-8 text-center text-muted-foreground text-sm">
                    <Link href="/login" className="underline underline-offset-4 hover:text-brand">
                        Already have an account? Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}

export const metadata = {
    title: "Register",
    description: "Register for an account",
    robots: {
        index: false,
        follow: false,
    },
} satisfies Metadata;
