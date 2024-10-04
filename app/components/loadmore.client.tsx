"use client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { PropsWithChildren, useRef, useState, useCallback, useEffect, useTransition } from "react";

const LoadMore = <T extends string | number | Record<string, any> = any>({
    children,
    startId,
    loadMoreAction,
    refreshId,
    initialLength = 0,
}: PropsWithChildren<{
    startId: T;
    loadMoreAction: (offset: T) => Promise<readonly [JSX.Element[], T | null]>;
    refreshId?: any;
    initialLength?: number;
}>) => {
    const ref = useRef<HTMLButtonElement>(null);
    const [loadMoreNodes, setLoadMoreNodes] = useState<JSX.Element[]>([]);

    const [disabled, setDisabled] = useState(false);
    const currentOffsetRef = useRef<T | undefined>(startId);
    const [isPending, startTransition] = useTransition();

    const loadMore = useCallback(
        async (abortController?: AbortController) =>
            startTransition(async () => {
                if (currentOffsetRef.current === undefined) return;

                const [node, next] = await loadMoreAction(currentOffsetRef.current)
                if (abortController?.signal.aborted) return;

                setLoadMoreNodes((prev) => [...prev, ...node]);

                if (next === null) {
                    currentOffsetRef.current ??= undefined;
                    setDisabled(true);
                } else {
                    currentOffsetRef.current = next;
                }

            }),
        [loadMoreAction]
    );

    useEffect(() => {
        const signal = new AbortController();

        const element = ref.current;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && element?.disabled === false) {
                loadMore(signal);
            }
        });

        if (element) {
            observer.observe(element);
        }

        return () => {
            signal.abort();
            if (element) {
                observer.unobserve(element);
            }
        };
    }, [loadMore]);

    useEffect(() => {
        setLoadMoreNodes([]);
        setDisabled(false);
        currentOffsetRef.current = startId;
    }, [startId, refreshId]);

    useEffect(() => {
        const num = loadMoreNodes.length + initialLength
        if (num === 0 || (initialLength === 10 && loadMoreNodes.length === 0)) return;

        const urlparams = new URLSearchParams(window.location.search);
        urlparams.set('take', num.toString());
        window.history.replaceState(null, '', '?' + urlparams.toString());
    }, [loadMoreNodes, initialLength]);

    return (
        <>
            {children}
            {loadMoreNodes}

            <Button
                variant="outline"
                className="flex gap-2"
                size="lg"
                ref={ref}
                disabled={disabled || isPending}
                onClick={() => loadMore()}
            >
                {isPending && <Loader2 className="size-5 text-muted-foreground animate-spin" />}
                {isPending ? "Loading..." : disabled ? "You have reached the bottom" : "Load More"}
            </Button>
        </>
    );
};

export default LoadMore;