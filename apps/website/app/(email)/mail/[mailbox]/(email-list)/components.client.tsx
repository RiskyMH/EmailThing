'use client'

import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/utils/tw";
import { StarIcon, Loader2, BellDotIcon, Trash2Icon, ArchiveRestoreIcon, MailOpenIcon, CheckIcon, RotateCcwIcon } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
        <Button variant="ghost" size="auto" onClick={onClick as any} aria-disabled={isPending} className={cn(className, "hover:bg-transparent rounded-full ring-offset-5", enabled && "text-blue/80")}>
            {isPending ?
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                : <StarIcon fill={enabled ? "currentColor" : "transparent"} className="h-5 w-5" />
            }
        </Button>
    )
}

function EmptyIcon(props: any) {
    return <div {...props} />
}

const iconMap: Record<string, LucideIcon> = {
    StarIcon: StarIcon,
    BellDotIcon: BellDotIcon,
    Trash2Icon: Trash2Icon,
    ArchiveRestoreIcon: ArchiveRestoreIcon,
    MailOpenIcon: MailOpenIcon,
    CheckIcon: CheckIcon,
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
            {icon === "EmptyIcon" && !isPending && <EmptyIcon className="w-5 h-5 text-muted/50" />}
            {isPending && <Loader2 className="w-5 h-5 text-muted/50 animate-spin" />}
            {children}
        </div>

    )
}

export function CategoryItem({ circleColor, name, count, link, category }: { circleColor: string | null, name: string, count: number, link: string, category: string | null }) {
    const params = useSearchParams();
    const isCurrent = params.get("category") == category;

    return (
        <Link href={link + (category ? "?category=" + category : "")} className={cn("group flex-shrink-0 inline-flex items-center gap-1 px-1 max-w-fit w-auto font-bold border-b-3 border-transparent", isCurrent && "border-blue")}>
            {circleColor && <div className="w-2.5 h-2.5 rounded-full mr-1" style={{ backgroundColor: circleColor }}></div>}
            <span className="font-medium group-hover:text-muted-foreground">{name}</span>
            <span className="text-sm text-muted-foreground group-hover:text-muted-foreground/50">({count})</span>
        </Link>
    )
}

export function RefreshButton({ className }: { className?: string }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition();

    return (
        <Button
            variant="ghost"
            size="auto"
            onClick={() => { !isPending && startTransition(router.refresh) }}
            className={cn(className, "rounded-full p-2 -m-2 text-muted-foreground hover:text-foreground ")}
        >
            <RotateCcwIcon className={cn(isPending && "animate-reverse-spin", "h-5 w-5 text-muted-foreground")} />
        </Button>
    )
}