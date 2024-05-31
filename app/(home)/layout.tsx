import Link from "next/link";
import { PropsWithChildren } from "react"
import { MainNavItem, Header } from "./components.client";
import Logo, { EmailThing, EmailthingText } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import UserNav from "@/components/user-navbar";

export const runtime = process.env.STANDALONE ? "nodejs" : "edge"

export default function HomeLayout({ children }: PropsWithChildren<{}>) {
    return (
        <>
            <Header className="container z-40 top-0 sticky flex h-20 items-center justify-between py-6 w-full transition-[height]">
                <div className="flex gap-6 md:gap-10">
                    <Link href="/home" className="items-center gap-1 flex group">
                        <EmailThing />
                    </Link>
                    <div className="flex gap-6">
                        <MainNavItem href="/home/#features" title="Features" />
                        <MainNavItem href="/pricing" title="Pricing" mobileShow />
                        <MainNavItem href="/docs" title="Documentation" />
                    </div>
                </div>
                <nav>
                    <UserNav fallbackLogin={true} />
                </nav>
            </Header>
            <main className="flex-1">
                {children}
            </main>
            <SiteFooter />
        </>
    )
}
