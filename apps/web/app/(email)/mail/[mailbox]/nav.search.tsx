"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/tw";
import { ChevronDownIcon, Loader2, SearchIcon } from "lucide-react";
import Form from "next/form";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

export function Search({ className, mailboxId }: { className?: string; mailboxId: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (ref.current) {
            ref.current.value = searchParams.get("q") || "";
        }
    }, [searchParams, pathname]);

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const q = form.q.value;

        startTransition(() => {
            if (!q) return router.push(pathname);
            const validPaths = [
                `/mail/${mailboxId}`,
                // `/mail/${mailboxId}/inbox`,
                `/mail/${mailboxId}/sent`,
                `/mail/${mailboxId}/drafts`,
                `/mail/${mailboxId}/trash`,
                `/mail/${mailboxId}/starred`,
                `/mail/${mailboxId}/temp`,
            ];
            if (!validPaths.includes(pathname)) {
                router.push(`/mail/${mailboxId}?q=${encodeURIComponent(q)}`);
            } else router.push(`?q=${encodeURIComponent(q)}`);
        });
    };

    return (
        <Form
            onSubmit={onSubmit}
            action={`/mail/${mailboxId}`}
            className={cn(
                "group flex h-10 w-full gap-2 self-center rounded bg-background px-1 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-secondary",
                className,
            )}
        >
            <Button
                size="icon-sm"
                variant="ghost"
                className="m-0.5 shrink-0 self-center rounded-full p-1.5 text-muted-foreground focus-visible:ring-1 focus-visible:ring-offset-0"
                type="submit"
            >
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
                className="w-full border-none bg-transparent focus-visible:outline-none"
            />
            <ChevronDownIcon className="me-2 self-center text-muted-foreground" />
        </Form>
    );
}
