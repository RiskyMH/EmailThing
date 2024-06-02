'use client'
import { Suspense, useEffect, useState, useTransition, type PropsWithChildren, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import TooltipText from "@/components/tooltip-text"


export function MarkRead({ action }: any) {
    useEffect(() => {
        action()
    }, [action])
    return null
}

export function BackButton({ fallbackUrl }: { fallbackUrl?: string }) {
    const router = useRouter()

    return (
        <TooltipText text="Back">
            <Button
                variant="ghost"
                size="auto"
                className="rounded-full p-2 -m-2 text-muted-foreground hover:text-foreground"
                onClick={() => {
                    if (history.length > 1) {
                        return router.back()
                    } else {
                        return router.push(fallbackUrl || "/")
                    }
                }}
            >
                <ArrowLeftIcon className="h-5 w-5" />
            </Button>
        </TooltipText>
    )

}

export function ViewSelect({ selected, htmlValid = false }: { selected: "text" | "markdown" | "html", htmlValid?: boolean }) {
    const router = useRouter()

    function onValueChange(v: string) {
        (window as any)?.emailContentLoading?.(v)
        router.replace("?view=" + v)
    }

    return (
        <DropdownMenuRadioGroup value={selected} onValueChange={onValueChange}>
            <DropdownMenuRadioItem value="text">Text</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="markdown">Markdown</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="html" disabled={!htmlValid}>HTML</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
    )
}

export function ClientSuspense({ fallback, children, currentView }: PropsWithChildren<{ fallback: ReactNode, currentView: string }>) {
    const [view, setPending] = useState(currentView)
    useEffect(() => {
        (window as any).emailContentLoading = setPending
    }, [])

    if (view != currentView) return fallback
    return (
        <Suspense key={view} fallback={fallback}>
            {children}
        </Suspense>
    )
}
