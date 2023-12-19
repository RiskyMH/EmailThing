"use client";
import { cn } from "@/app/utils/tw";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren, ReactElement } from "react";

export function SideBarLink({ href, className, children }: PropsWithChildren<{ href: string, className: string}>) {
    const pathName = usePathname()

    return (
        <Link
            href={href}
            className={cn(className, pathName === href && "text-blue dark:text-foreground")}
        >
            {/* make a vertical line on very left of screen */}
            {pathName === href && <span className="absolute left-0 w-1 bg-blue dark:bg-foreground self-center h-10 rounded-r" />}

            {children}
        </Link>
    )
}