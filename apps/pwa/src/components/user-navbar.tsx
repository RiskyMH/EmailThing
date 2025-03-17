import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { UserDropDown } from "./user-nav.client";
import { useLiveQuery } from "dexie-react-hooks";
import { getMe } from "@/utils/data/queries/user";

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

function UserNavFallback() {
    return <div className="size-8 animate-pulse self-center rounded-full bg-secondary" />;
}

function UserNavLogin() {
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
