import { Link } from "react-router-dom";
import { Suspense, use } from "react";
import { buttonVariants } from "@/components/ui/button";
import { UserDropDown } from "./user-nav.client";
import { useGravatar } from "@/utils/fetching";
export default function UserNav({ fallbackLogin }: { fallbackLogin?: boolean }) {
    const Fallback = fallbackLogin ? UserNavLogin : UserNavFallback;
    return (
        <Suspense fallback={<Fallback />}>
            <UserNavv />
        </Suspense>
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

export function UserNavv() {
    const user = document.cookie.includes('test') ? { username: "Demo", email: "demo@emailthing.xyz" } : false
    if (!user) return <UserNavLogin />;
    // if (!user.onboardingStatus?.initial) return redirect("/onboarding/welcome");

    // const img = use<string | undefined>(user.email ? gravatar(user.email) : Promise.resolve(undefined))
    // const img = useGravatar(user.email)

    return (
        <UserDropDown
            user={{
                name: user.username,
                secondary: user.email,
                email: user.email,
                // image: img,
            }}
        />
    );
}
