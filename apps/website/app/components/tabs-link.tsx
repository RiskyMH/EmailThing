import Link from "next/link";
import { PropsWithChildren } from "react";


export function TabsList({ children }: PropsWithChildren<{}>) {
    return (
        <div className="inline-flex h-10 items-center justify-center rounded-md bg-card p-1 text-card-foreground">
            {children}
        </div>
    )
}

export function Tab({ title, href, active = false, disabled = null }: { title: string, href: string, active?: boolean, disabled?: boolean | null }) {
    const className = "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
    return disabled ? (
        <button disabled className={className}>
            {title}
        </button>
    ) : (
        <Link href={href} data-state={active ? 'active' : null} prefetch={false} className={className} >
            {title}
        </Link>
    )
}
