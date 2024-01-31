'use client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect } from "react";
import Link from "next/link"
import { useRouter } from "next/navigation";
import { cn } from "@/utils/tw";

export function MarkRead({ action }: any) {
    useEffect(() => {
        action()
    }, [action])
    return null
}

export function ViewSelect({ selected, className, htmlValid = false }: { selected: "text" | "markdown" | "html", htmlValid?: boolean, className?: string }) {
    const router = useRouter()

    function onValueChange(v: string) {
        router.push("?view=" + v)
    }

    return (
        <Select defaultValue={selected} onValueChange={onValueChange}>
            <SelectTrigger className={cn("w-[120px] border-none", className)}>
                <SelectValue placeholder="markdown" />
            </SelectTrigger>
            <SelectContent>
                <Link href="?view=text">
                    <SelectItem value="text">Text</SelectItem>
                </Link>
                <Link href="?view=markdown">
                    <SelectItem value="markdown">Markdown</SelectItem>
                </Link>
                {htmlValid ? (
                    <Link href="?view=html">
                        <SelectItem value="html">HTML</SelectItem>
                    </Link>
                ) : (
                    <SelectItem value="html" disabled>HTML</SelectItem>
                )}
            </SelectContent>
        </Select>

    )
}
