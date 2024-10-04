import "server-only";

import db, { User } from "@/db";
import { getCurrentUser } from "@/utils/jwt";
import { gravatar } from "@/utils/tools";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "./ui/button";
import { UserDropDown } from "./user-nav.client";

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
            href="/login"
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

export async function UserNavv() {
    const userId = await getCurrentUser();
    if (!userId) return <UserNavLogin />;

    const user = await db.query.User.findFirst({
        where: eq(User.id, userId),
        columns: {
            username: true,
            onboardingStatus: true,
            email: true,
        },
    });
    if (!user) return <UserNavLogin />;
    // if (!user.onboardingStatus?.initial) return redirect("/onboarding/welcome");

    return (
        <UserDropDown
            user={{
                name: user.username,
                secondary: user.email,
                image: user.email ? await gravatar(user.email) : undefined,
            }}
        />
    );
}
