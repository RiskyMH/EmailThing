'use client'

import { Button } from "@/app/components/ui/button";
import { StarIcon, Loader2 } from "lucide-react"
import type { MouseEvent } from "react"
import { useTransition } from 'react';

export function ClientStar({ action, enabled, className }: any) {

    const [isPending, startTransition] = useTransition();
    
    const onClick = (e: MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();
        e.stopPropagation();
        if (isPending) return;

        startTransition(() => action())
    }

    return (
        <Button variant="ghost" size="auto" onClick={onClick as any} aria-disabled={isPending} className={className + " hover:bg-transparent"}>
            {isPending ?
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                : <StarIcon fill={enabled ? "currentColor" : "transparent"} className="h-5 w-5" />
            }
        </Button>
    )
}