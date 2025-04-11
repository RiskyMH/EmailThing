import { Link } from "react-router-dom";
import { Button, buttonVariants } from "@/components/ui/button";
import { UserDropDown } from "./user-nav.client";
import { useLiveQuery } from "dexie-react-hooks";
import { getMe } from "@/utils/data/queries/user";
import { db } from "@/utils/data/db";
import { ArrowRightIcon } from "lucide-react";

export default function UserNav({ fallbackLogin }: { fallbackLogin?: boolean }) {
    const Fallback = fallbackLogin ? UserNavLogin : UserNavFallback;

    const user = useLiveQuery(async () => await getMe() || null, [])
    if (user === undefined) return <Fallback />;
    else if (user === null) return <UserNavLogin />;


    return (
        <UserDropDown
            user={{
                name: user.username,
                secondary: user.email,
                email: user.email,
            }}
        />
    );
}

export function UserNavFallback() {
    return <div className="size-8 animate-pulse self-center rounded-full bg-secondary" />;
}

export function UserNavLogin() {
    return (
        <Link
            to="/login"
            className={buttonVariants({
                variant: "secondary",
                size: "sm",
                className: "px-4",
            })}
        >
            Login
        </Link>
    );
}

export function DemoLink() {
    const isLoggedIn = useLiveQuery(async () => {
        const users = await db.user.count()
        return users > 0
    }, [], null)

    if (isLoggedIn === true || isLoggedIn === null) return null
    return (
        <Button variant="ghost" asChild size="sm">
            <Link to="/mail/demo" className="flex items-center gap-2 group max-sm:hidden">
                Demo
                <ArrowRightIcon className="size-4 text-muted-foreground group-hover:-me-0.5 group-hover:ms-0.5 transition-all" />
            </Link>
        </Button>
    )
}