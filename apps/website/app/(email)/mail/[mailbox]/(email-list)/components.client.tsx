'use client'

import { Button } from "@/app/components/ui/button";
import { StarIcon, Loader2, BellDotIcon, Trash2Icon, ArchiveRestoreIcon, MailOpenIcon } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { MouseEvent } from "react"
import { useTransition } from 'react';

export function ClientStar({ action, enabled, className }: any) {

    const [isPending, startTransition] = useTransition();

    const onClick = (e: MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();
        e.stopPropagation();
        if (isPending) return;

        startTransition(action)
    }

    return (
        <Button variant="ghost" size="auto" onClick={onClick as any} aria-disabled={isPending} className={className + " hover:bg-transparent rounded-full ring-offset-5"}>
            {isPending ?
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                : <StarIcon fill={enabled ? "currentColor" : "transparent"} className="h-5 w-5" />
            }
        </Button>
    )
}

const iconMap: Record<string, LucideIcon> = {
    StarIcon: StarIcon,
    BellDotIcon: BellDotIcon,
    Trash2Icon: Trash2Icon,
    ArchiveRestoreIcon: ArchiveRestoreIcon,
    MailOpenIcon: MailOpenIcon
}

export function ContextMenuAction({ children, action, icon, fillIcon, ...props }: any) {
    const Icon: LucideIcon | null = iconMap[icon] ?? null;

    const [isPending, startTransition] = useTransition();

    const onClick = (e: MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();
        if (isPending) return;

        startTransition(action)
    }

    return (
        <div {...props} onClick={onClick}>
            {Icon && !isPending && <Icon className="w-5 h-5 text-muted/50" fill={fillIcon ? "currentColor" : "transparent"} />}
            {!!Icon && isPending && <Loader2 className="w-5 h-5 text-muted/50 animate-spin" />}
            {children}
        </div>

    )
}