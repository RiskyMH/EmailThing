"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/tw";
import { ChevronDownIcon, Loader2, SearchIcon } from "lucide-react";
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
        <Input asChild className="bg-input px-1 border-none w-full lg:w-96 h-9 rounded-lg 2xl:ms-1">
            <form
                onSubmit={onSubmit}
                action={`/mail/${mailboxId}`}
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
            </form>
        </Input>
    );
}
