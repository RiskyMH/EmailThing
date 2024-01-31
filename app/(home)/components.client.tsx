"use client"
import Link from "next/link"
import { useSelectedLayoutSegment } from "next/navigation"
import { cn } from "@/utils/tw"
import { PropsWithChildren } from "react"

export function MainNavItem({ href, title, disabled = false, mobileShow = false }: PropsWithChildren<{ href: string, disabled?: boolean, title: string, mobileShow?: boolean }>) {
    const segment = useSelectedLayoutSegment()

    return (
        <Link
            href={disabled ? "#" : href}
            className={cn(
                "hidden md:flex items-center text-sm font-medium transition-colors hover:text-foreground/80 ",
                (href === `/${segment}`)
                    ? "text-foreground"
                    : "text-foreground/60",
                disabled && "cursor-not-allowed opacity-80",
                mobileShow && "flex"
            )}
        >
            {title}
        </Link>
    )
}