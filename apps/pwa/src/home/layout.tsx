'use client'
import { EmailThing } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import UserNav from "@/components/user-navbar";
import { useMatch } from "react-router-dom";
import Link from "@/components/link";
import { useEffect, useState, type PropsWithChildren } from "react";
import { cn } from "@/utils/tw";
import { ExternalLinkIcon, ArrowRightIcon } from "lucide-react"
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/utils/data/db";
import { Button } from "@/components/ui/button";

export default function HomeLayout({ children }: PropsWithChildren) {
    return (
        <div className="bg-background" vaul-drawer-wrapper="">
            <Header className="container sticky top-0 z-40 flex h-20 w-full items-center justify-between py-6 transition-[height]">
                <div className="flex gap-6 md:gap-10">
                    <Link href="/home" className="group flex items-center gap-1">
                        <EmailThing />
                    </Link>
                    <div className="flex gap-6">
                        <MainNavItem href="/home#features" title="Features" />
                        <MainNavItem href="/pricing" title="Pricing" mobileShow />
                        <MainNavItem href="/docs" title="Documentation" />
                    </div>
                </div>
                <nav className="flex items-center gap-4">
                    <DemoLink />
                    <UserNav fallbackLogin={true} />
                </nav>
            </Header>
            <main className="flex-1 bg-background">{children}</main>
            <SiteFooter />
        </div>
    );
}


export function MainNavItem({
    href,
    title,
    disabled = false,
    mobileShow = false,
}: PropsWithChildren<{
    href: string;
    disabled?: boolean;
    title: string;
    mobileShow?: boolean;
}>) {
    const match = useMatch(href + "/*")
    // const segment = useSelectedLayoutSegment();

    return (
        <Link
            href={disabled ? "#" : href}
            target={href.startsWith("http") ? "_blank" : undefined}
            className={cn(
                "hidden items-center gap-2 font-medium text-sm transition-colors hover:text-foreground/80 md:flex",
                match ? "text-foreground" : "text-foreground/60",
                disabled && "cursor-not-allowed opacity-80",
                mobileShow && "flex",
            )}
        >
            {title}
            {href.startsWith("http") && <ExternalLinkIcon className="size-4 stroke-[3px]" />}
        </Link>
    );
}

export function Header({ children, className }: PropsWithChildren<{ className?: string }>) {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const isScrolled = window.scrollY > 0;
            setScrolled(isScrolled);
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return <header className={cn(className, scrolled && "h-16 border-b-2 bg-background")}>{children}</header>;
}


function DemoLink() {
    const isLoggedIn = useLiveQuery(async () => {
        const users = await db.user.count()
        return users > 0
    }, [], null)

    if (isLoggedIn === true || isLoggedIn === null) return null
    return (
        <Button variant="ghost" asChild size="sm">
            <Link href="/mail/demo" className="flex items-center gap-2 group max-sm:hidden">
                Demo
                <ArrowRightIcon className="size-4 text-muted-foreground group-hover:-me-0.5 group-hover:ms-0.5 transition-all" />
            </Link>
        </Button>
    )
}