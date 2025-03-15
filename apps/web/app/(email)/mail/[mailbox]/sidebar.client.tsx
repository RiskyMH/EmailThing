"use client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/utils/tw";
import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type PropsWithChildren, useEffect, useState } from "react";
import { useWindowSize } from "usehooks-ts";

export function SidebarLink({
    href,
    className,
    children,
    disabled,
    alaisMatch,
}: PropsWithChildren<{ href: string; className: string; disabled?: boolean, alaisMatch?: string }>) {
    const pathName = usePathname();

    if (disabled) {
        return (
            <div
                className={cn(
                    "group relative flex h-10 w-full cursor-not-allowed items-center gap-4 rounded px-3 opacity-50",
                    className,
                )}
            >
                {children}
            </div>
        );
    }

    return (
        <Link href={href} className={cn(className, pathName === href && "text-blue dark:text-foreground")}>
            {/* make a vertical line on very left of screen */}
            {pathName === href || (alaisMatch && pathName === alaisMatch) && (
                <span className="sm:-ms-6 absolute start-0 me-1 h-10 w-1 self-center rounded-e bg-blue sm:relative sm:start-auto dark:bg-foreground" />
            )}

            {children}
        </Link>
    );
}

export function MobileNav({ children }: PropsWithChildren) {
    const [open, setOpen] = useState(false);
    const windowSize = useWindowSize();
    useEffect(() => setOpen(false), [windowSize]);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="-ms-2 me-auto inline p-2 hover:bg-transparent sm:hidden" asChild>
                <Button variant="ghost" size="icon">
                    <MenuIcon />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="overflow-y-auto" onClick={() => setOpen(false)}>
                {children}
            </SheetContent>
        </Sheet>
    );
}
