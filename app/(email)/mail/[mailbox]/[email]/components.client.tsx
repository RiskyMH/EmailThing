'use client'
import { useEffect, type PropsWithChildren } from "react";
import { useRouter } from "next/navigation";
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
        router.push("?view=" + v)
    }

    return (
        <DropdownMenuRadioGroup value={selected} onValueChange={onValueChange}>
            <DropdownMenuRadioItem value="text">Text</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="markdown">Markdown</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="html" disabled={!htmlValid}>HTML</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
    )
}
