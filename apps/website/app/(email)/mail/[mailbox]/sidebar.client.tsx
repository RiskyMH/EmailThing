"use client";
import { cn } from "@/app/utils/tw";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren, useEffect, useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/app/components/ui/sheet"
import { MenuIcon } from "lucide-react";
import { useWindowSize } from "usehooks-ts";
import { Button } from "@/app/components/ui/button";

export function SidebarLink({ href, className, children, disabled }: PropsWithChildren<{ href: string, className: string, disabled?: boolean }>) {
    const pathName = usePathname()

    if (disabled) {
        return (
            <div className={cn(className, "relative group flex items-center h-10 w-full px-3 gap-2 rounded cursor-not-allowed opacity-50")}>
                {children}
            </div>
        )
    }

    return (
        <Link
            href={href}
            className={cn(className, pathName === href && "text-blue dark:text-foreground")}
        >
            {/* make a vertical line on very left of screen */}
            {pathName === href && <span className="absolute start-0 w-1 bg-blue dark:bg-foreground self-center h-10 rounded-e" />}

            {children}
        </Link>
    )
}

export function MobileNav({ children }: PropsWithChildren<{}>) {
    const [open, setOpen] = useState(false)
    const windowSize = useWindowSize()
    useEffect(() => setOpen(false), [windowSize])

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="inline sm:hidden me-auto hover:bg-transparent p-2 -ms-2" asChild>
                <Button variant="ghost" size="icon">
                    <MenuIcon />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="overflow-y-auto" onClick={() => setOpen(false)}>
                {children}
            </SheetContent>
        </Sheet>
    )
}