"use client";
import { Button } from "@/app/components/ui/button";
import { Loader2 } from "lucide-react";
import * as React from "react";

type loadMoreAction<T extends string | number = any> = T extends number
    ? (offset: T) => Promise<readonly [React.JSX.Element[], number | null]>
    : T extends string
    ? (offset: T) => Promise<readonly [React.JSX.Element[], string | null]>
    : any;

const LoadMore = <T extends string | number = any>({
    children,
    startId,
    loadMoreAction,
}: React.PropsWithChildren<{
    startId: T;
    loadMoreAction: loadMoreAction<T>;
}>) => {
    const ref = React.useRef<HTMLButtonElement>(null);
    const [loadMoreNodes, setLoadMoreNodes] = React.useState<React.JSX.Element[]>(
        []
    );

    const [disabled, setDisabled] = React.useState(false);
    const currentOffsetRef = React.useRef<number | string | undefined>(
        startId
    );
    const [loading, setLoading] = React.useState(false);

    const loadMore = React.useCallback(
        async (abortController?: AbortController) => {
            setLoading(true);

            // @ts-expect-error Can't yet figure out how to type this
            loadMoreAction(currentOffsetRef.current)
                .then(([node, next]) => {
                    if (abortController?.signal.aborted) return;

                    setLoadMoreNodes((prev) => [...prev, ...node]);
                    if (next === null) {
                        currentOffsetRef.current ??= undefined;
                        setDisabled(true);
                        return;
                    }

                    currentOffsetRef.current = next;
                })
                .catch(() => { })
                .finally(() => setLoading(false));
        },
        [loadMoreAction]
    );

    React.useEffect(() => {
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

    return (
        <>
            {children}
            {loadMoreNodes}

            <Button
                variant="outline"
                className="flex gap-2"
                size="lg"
                ref={ref}
                disabled={disabled || loading}
                onClick={() => loadMore()}
            >
                {loading && <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />}
                {loading ? "Loading..." : disabled ? "You have reached the bottom" : "Load More"}
            </Button>
        </>
    );
};

export default LoadMore;