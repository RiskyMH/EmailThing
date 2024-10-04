"use client";

import { useEffect, useMemo, useState } from "react";

import { cn } from "@/utils/tw";

export interface TOC {
    title?: string;
    href?: string;
    children?: TOC[];
}

interface TocProps {
    toc: TOC[];
}

export function DashboardTableOfContents({ toc }: TocProps) {
    const itemIds = useMemo(
        () =>
            toc
                ? toc
                      .flatMap((item) => [item.href, item?.children?.map((item) => item.href)])
                      .flat()
                      .map((id) => id?.split("#")[1])
                : [],
        [toc],
    );
    const activeHeading = useActiveItem(itemIds);

    if (toc.length === 0) return;

    return (
        <div className="flex flex-col gap-2">
            <p className="font-medium">On This Page</p>
            <Tree tree={toc} activeItem={activeHeading} />
        </div>
    );
}

function useActiveItem(itemIds: (string | undefined)[]) {
    const [activeId, setActiveId] = useState<string>("");

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                }
            },
            { rootMargin: "0% 0% -80% 0%" },
        );

        for (const id of itemIds || []) {
            if (!id) continue;

            const element = document.getElementById(id);
            if (element) {
                observer.observe(element);
            }
        }

        return () => {
            if (!itemIds) return;
            for (const id of itemIds) {
                if (!id) continue;

                const element = document.getElementById(id);
                if (element) {
                    observer.unobserve(element);
                }
            }
        };
    }, [itemIds]);

    return activeId;
}

interface TreeProps {
    tree: TOC[];
    level?: number;
    activeItem?: string | null;
}

function Tree({ tree, level = 1, activeItem }: TreeProps) {
    if (!tree?.length) return;
    return (
        <ul className={cn("m-0 list-none", { "pl-4": level !== 1 })}>
            {tree.map((item, index) => {
                return (
                    <li key={index} className={cn("mt-0 pt-2")}>
                        <a
                            href={item.href}
                            className={cn(
                                "inline-block no-underline",
                                item.href === `#${activeItem}`
                                    ? "font-medium text-primary"
                                    : "text-muted-foreground text-sm",
                            )}
                        >
                            {item.title}
                        </a>
                        {item.children?.length && (
                            <Tree tree={item.children} level={level + 1} activeItem={activeItem} />
                        )}
                    </li>
                );
            })}
        </ul>
    );
}
