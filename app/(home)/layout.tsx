import Link from "next/link";
import { MailIcon } from "lucide-react"
import { PropsWithChildren } from "react"
import { buttonVariants } from "@/app/components/ui/button";
import { cn } from "@/app/utils/tw";
import { MainNavItem } from "./components.client";

export default function HomeLayout({ children }: PropsWithChildren<{}>) {
    return (
        <div className="flex min-h-screen flex-col">
            <header className="container z-40 bg-background">
                <div className="flex h-20 items-center justify-between py-6">
                    <div className="flex gap-6 md:gap-10">
                        <Link href="/home" className="items-center space-x-2 flex">
                            <MailIcon />
                            <span className="font-bold inline-block">
                                EmailThing
                            </span>
                        </Link>
                        <MainNavItem href="/home/#features" title="Features" />
                        <MainNavItem href="/pricing" title="Pricing" mobileShow />
                    </div>
                    <nav>
                        <Link
                            href="/login"
                            className={cn(
                                buttonVariants({ variant: "secondary", size: "sm" }),
                                "px-4"
                            )}
                        >
                            Login
                        </Link>
                    </nav>
                </div>
            </header>
            <main className="flex-1">
                {children}
            </main>
            <SiteFooter />
        </div>
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
                            rel="noreferrer"
                            className="font-medium underline underline-offset-4"
                        >
                            RiskyMH
                        </a>
                        . The source code is available on{" "}
                        <a
                            href="https://github.com/RiskyMH/Email"
                            target="_blank"
                            rel="noreferrer"
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