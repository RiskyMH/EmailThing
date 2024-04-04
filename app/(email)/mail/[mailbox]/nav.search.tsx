'use client'
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/tw";
import { SearchIcon, ChevronDownIcon, Loader2 } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useRef, useEffect, useTransition } from "react";

export function Search({ className, mailboxId }: { className?: string, mailboxId: string }) {
    const router = useRouter()
    const searchParams = useSearchParams();
    const pathname = usePathname()
    const [isPending, startTransition] = useTransition();

    const ref = useRef<HTMLInputElement>(null)
    useEffect(() => {
        if (ref.current) {
            ref.current.value = searchParams.get("q") || ""
        }
    }, [searchParams, pathname])


    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = e.currentTarget
        const q = form.q.value

        startTransition(() => {
            if (!q) return router.push(pathname)
            const validPaths = [
                `/mail/${mailboxId}`,
                // `/mail/${mailboxId}/inbox`,
                `/mail/${mailboxId}/sent`,
                `/mail/${mailboxId}/drafts`,
                `/mail/${mailboxId}/trash`,
                `/mail/${mailboxId}/starred`
            ]
            if (!validPaths.includes(pathname)) {
                router.push(`/mail/${mailboxId}?q=${q}`)
            }

            else router.push(`?q=${q}`)

        })
    }

    return (
        <form
            onSubmit={onSubmit} className={cn(className, "group h-10 w-full py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-background dark:bg-secondary rounded flex self-center px-1 gap-2")}
        >
            <Button size="icon-sm" variant="ghost" className="self-center text-muted-foreground rounded-full flex-shrink-0 m-0.5 p-1.5 focus-visible:ring-offset-0 focus-visible:ring-1" type="submit">
                {isPending ? (
                    <Loader2 className="animate-spin self-center text-muted-foreground" />
                ) : (
                    <SearchIcon className="self-center text-muted-foreground" />
                )}
            </Button>
            <input
                ref={ref}
                type="search"
                name="q"
                placeholder="Search emails..."
                className="w-full focus-visible:outline-none bg-transparent"
            />
            <ChevronDownIcon className="self-center text-muted-foreground me-2" />
        </form>
    )
}