"use client";
import { cn } from "@/utils/tw";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface DocsSidebarNavProps {
    items: {
        title: string;
        items: {
            href: string;
            title: string;
            external?: boolean;
            disabled?: boolean;
        }[];
    }[];
}

export function DocsSidebarNav({ items }: DocsSidebarNavProps) {
    const pathname = usePathname();

    return items.length ? (
        <div className="w-full">
            {items.map((item, index) => (
                <div key={index} className={cn("pb-8")}>
                    <h4 className="mb-1 rounded-md px-2 py-1 font-medium text-sm">{item.title}</h4>
                    {item.items ? (
                        <div className="grid grid-flow-row auto-rows-max text-sm">
                            {item.items.map((item, index) =>
                                !item.disabled && item.href ? (
                                    <Link
                                        key={index}
                                        href={item.href}
                                        className={cn(
                                            "flex w-full items-center rounded-md p-2 hover:underline",
                                            pathname === item.href && "bg-accent/65",
                                        )}
                                        target={item.external ? "_blank" : ""}
                                    >
                                        {item.title}
                                    </Link>
                                ) : (
                                    <span
                                        key={index}
                                        className="flex w-full cursor-not-allowed items-center rounded-md p-2 opacity-60"
                                    >
                                        {item.title}
                                    </span>
                                ),
                            )}
                        </div>
                    ) : null}
                </div>
            ))}
        </div>
    ) : null;
}
