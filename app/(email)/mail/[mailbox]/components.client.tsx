"use client";

import TooltipText from "@/components/tooltip-text";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/tw";
import {
    ArchiveRestoreIcon,
    BellDotIcon,
    CheckIcon,
    Loader2,
    MailOpenIcon,
    RotateCcwIcon,
    StarIcon,
    Trash2Icon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent, PropsWithChildren } from "react";
import { useEffect, useTransition } from "react";

export function ClientStar({
    action,
    enabled,
    className,
}: { action: () => void; enabled: boolean; className?: string }) {
    const [isPending, startTransition] = useTransition();

    const onClick = (e: MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();
        e.stopPropagation();
        if (isPending) return;

        startTransition(action);
    };

    return (
        <Button
            variant="ghost"
            size="auto"
            onClick={onClick as any}
            aria-disabled={isPending}
            className={cn(
                className,
                "rounded-full ring-offset-5 hover:bg-transparent hover:text-amber-500",
                enabled && "text-amber-500 hover:text-foreground",
            )}
        >
            {isPending ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : (
                <StarIcon fill={enabled ? "currentColor" : "transparent"} className="size-4" />
            )}
        </Button>
    );
}

function EmptyIcon(props: any) {
    return <div {...props} />;
}

const iconMap: Record<string, LucideIcon> = {
    StarIcon: StarIcon,
    BellDotIcon: BellDotIcon,
    Trash2Icon: Trash2Icon,
    ArchiveRestoreIcon: ArchiveRestoreIcon,
    MailOpenIcon: MailOpenIcon,
    CheckIcon: CheckIcon,
};
interface ContextMenuActionProps {
    action: () => void;
    icon: keyof typeof iconMap | "EmptyIcon";
    fillIcon?: boolean | null;
    tooltip?: string;
    size?: "small" | "normal";
}

export function ContextMenuAction({
    children,
    action,
    icon,
    fillIcon,
    tooltip,
    size,
    ...props
}: PropsWithChildren<ContextMenuActionProps>) {
    const Icon: LucideIcon | null = iconMap[icon] ?? null;

    const [isPending, startTransition] = useTransition();

    const onClick = (e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => {
        e.preventDefault();
        if (isPending) return;

        startTransition(action);
    };

    const base = (
        <button {...props} onClick={onClick}>
            {Icon && !isPending && (
                <Icon
                    className={cn("size-5", size === "small" && "size-4", children && "text-muted-foreground")}
                    fill={fillIcon ? "currentColor" : "transparent"}
                />
            )}
            {icon === "EmptyIcon" && !isPending && (
                <EmptyIcon className={cn("size-5 text-muted-foreground", size === "small" && "size-4")} />
            )}
            {isPending && (
                <Loader2 className={cn("size-5 animate-spin text-muted-foreground", size === "small" && "size-4")} />
            )}
            {children}
        </button>
    );

    if (tooltip) {
        return (
            <TooltipText text={tooltip}>
                <Button
                    variant="ghost"
                    size="auto"
                    className="-m-2 rounded-full p-2 text-muted-foreground hover:text-foreground"
                    asChild
                >
                    {base}
                </Button>
            </TooltipText>
        );
    }

    return base;
}

export function RefreshButton({ className }: { className?: string }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        const focus = () => !document.hidden && startTransition(router.refresh);
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "r" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                startTransition(router.refresh);
            }
        };

        document.addEventListener("visibilitychange", focus);
        document.addEventListener("keydown", onKeyDown);

        return () => {
            document.removeEventListener("visibilitychange", focus);
            document.removeEventListener("keydown", onKeyDown);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Button
            variant="ghost"
            size="auto"
            onClick={() => {
                !isPending && startTransition(router.refresh);
            }}
            className={cn(className, "-m-2 rounded-full p-2 text-muted-foreground hover:text-foreground ")}
        >
            <RotateCcwIcon className={cn(isPending && "animate-reverse-spin", "size-5 text-muted-foreground")} />
        </Button>
    );
}

const changeMailboxCookie = (mailboxId: string) => {
    document.cookie = `mailboxId=${mailboxId}; path=/; Expires=Fri, 31 Dec 9999 23:59:59 GMT;`;
};

export function MailboxLink({ mailboxId, children, ...props }: PropsWithChildren<{ mailboxId: string }>) {
    return (
        <Link {...props} onClick={() => changeMailboxCookie(mailboxId)} href={`/mail/${mailboxId}`}>
            {children}
        </Link>
    );
}
