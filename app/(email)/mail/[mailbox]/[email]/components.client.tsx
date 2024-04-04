'use client'
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu";

export function MarkRead({ action }: any) {
    useEffect(() => {
        action()
    }, [action])
    return null
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
