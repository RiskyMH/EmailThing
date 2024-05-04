import Link from "next/link";
import { MailIcon } from "lucide-react"
import { PropsWithChildren } from "react"
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/utils/tw";
import { MainNavItem } from "./components.client";
import Logo from "@/components/logo";

export default function HomeLayout({ children }: PropsWithChildren<{}>) {
    return (
        <div className="flex min-h-screen flex-col">
            <header className="container z-40 bg-background">
                <div className="flex h-20 items-center justify-between py-6">
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
                            href="https://github.com/RiskyMH/EmailThing"
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