import Link from "next/link";
import { MailIcon } from "lucide-react"
import { PropsWithChildren, Suspense, type ReactNode } from "react"
import { buttonVariants } from "@/components/ui/button";
import { MainNavItem, Header } from "./components.client";
import Logo from "@/components/logo";
import { getCurrentUser } from "@/utils/jwt";
import db, { User } from "@/db";
import { eq } from "drizzle-orm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { gravatar } from "@/utils/tools";

export const runtime = "edge"

export default async function HomeLayout({ children }: PropsWithChildren<{}>) {
    const userId = await getCurrentUser()

    return (
        <>
            <Header className="container z-40 top-0 sticky flex h-20 items-center justify-between py-6 w-full transition-[height]">
                <div className="flex gap-6 md:gap-10">
                    <Link href="/home" className="items-center gap-1 flex group">
                        <Logo className="h-7 w-7" />
                        <h1 className="inline-block whitespace-nowrap font-bold text-lg group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-br from-[#FF9797] to-[#6D6AFF] group-hover:transition-all group-hover:duration-200">
                            EmailThing
                        </h1>
                    </Link>
                    <MainNavItem href="/home/#features" title="Features" />
                    <MainNavItem href="/pricing" title="Pricing" mobileShow />
                </div>
                <nav>
                    {userId ? (
                        <Suspense fallback={<div className="h-8 w-8 rounded-full bg-secondary animate-pulse" />}>
                            <UserIcon userId={userId} />
                        </Suspense>
                    ) : (
                        <Link
                            href="/login"
                            className={buttonVariants({ variant: "secondary", size: "sm", className: "px-4" })}
                        >
                            Login
                        </Link>
                    )}
                </nav>
            </Header>
            <main className="flex-1">
                {children}
            </main>
            <SiteFooter />
        </>
    )
}

async function UserIcon({ userId }: { userId: string }) {
    const user = await db.query.User.findFirst({
        where: eq(User.id, userId),
        columns: {
            username: true,
            email: true
        }
    })
    if (!user) return "Error?"

    return (
        <Avatar className="h-8 w-8 rounded-full">
            <AvatarImage src={await gravatar(user.email)} alt={user.username} className="bg-background dark:bg-secondary" />
            <AvatarFallback className="bg-background dark:bg-secondary">
                {user.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
        </Avatar>
    )
}


function SiteFooter() {
    return (
        <footer>
            <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
                <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
                    <MailIcon />
                    <p className="text-center text-sm leading-loose md:text-left">
                        Built by{" "}
                        <a
                            href="https://riskymh.dev"
                            target="_blank"
                            className="font-medium underline underline-offset-4"
                        >
                            RiskyMH
                        </a>
                        . The source code is available on{" "}
                        <a
                            href="https://github.com/RiskyMH/EmailThing"
                            target="_blank"
                            className="font-medium underline underline-offset-4"
                        >
                            GitHub
                        </a>
                        .
                    </p>
                </div>
            </div>
        </footer>
    )
}