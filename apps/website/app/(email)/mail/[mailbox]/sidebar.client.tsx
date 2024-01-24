"use client";
import { cn } from "@/app/utils/tw";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren, useEffect, useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/app/components/ui/sheet"
import { Button } from "@/app/components/ui/button";
import { MenuIcon } from "lucide-react";
import { useMediaQuery, useWindowSize } from "usehooks-ts";

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
            <SheetTrigger className="inline sm:hidden me-auto">
                {/* <Button asChild variant="ghost"> */}
                <MenuIcon />
                {/* </Button> */}
            </SheetTrigger>
            <SheetContent side="left" onClick={() => setOpen(false)}>
                {children}
                {/* <SheetHeader>
                    <SheetTitle>Are you absolutely sure?</SheetTitle>
                    <SheetDescription>
                        This action cannot be undone. This will permanently delete your account
                        and remove your data from our servers.
                    </SheetDescription>
                </SheetHeader> */}
            </SheetContent>
        </Sheet>
    )
}