"use client";
import { cn } from "@/utils/tw";
import { ExternalLinkIcon } from "lucide-react";
import { type PropsWithChildren, useState, useEffect } from "react";
import Link from "next/link";

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
    const match = false;
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

    return (
        <header className={cn(className, scrolled && "h-16 border-b-2 bg-background")}>
            {children}
        </header>
    );
}
