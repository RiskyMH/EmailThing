import { EmailThing } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import UserNav from "@/components/user-navbar";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import { Header, MainNavItem } from "./components.client";

export const runtime = "edge";

export default function HomeLayout({ children }: PropsWithChildren) {
    return (
        <>
            <Header className="container sticky top-0 z-40 flex h-20 w-full items-center justify-between py-6 transition-[height]">
                <div className="flex gap-6 md:gap-10">
                    <Link href="/home" className="group flex items-center gap-1">
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
            <main className="flex-1">{children}</main>
            <SiteFooter />
        </>
    );
}
