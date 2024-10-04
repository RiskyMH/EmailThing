import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/utils/jwt";
import { cn } from "@/utils/tw";
import { ChevronLeft } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, User } from "@/db";
import { Page } from "./components.client";
import { changeBackupEmail } from "@/(user)/actions";

export const metadata = {
    title: {
        absolute: "Welcome to EmailThing",
    }
} satisfies Metadata


export default async function WelcomePage() {
    const userId = await getCurrentUser();
    if (!userId) return redirect("/login?from=/settings");

    const user = await db.query.User.findFirst({
        where: eq(User.id, userId),
        columns: {
            id: true,
            username: true,
            email: true,
            onboardingStatus: true
        }
    })
    if (!user) return notFound();
    // if (user.onboardingStatus?.initial) return redirect("/mail");

    const githubStars = (await (await fetch("https://api.github.com/repos/RiskyMH/EmailThing", { next: { revalidate: 60 } })).json()).stargazers_count;

    return (
        <div className="mx-auto w-full flex flex-col gap-3 sm:w-[500px] mt-16">
            <h1 className="text-2xl text-center pb-2">Welcome to EmailThing!</h1>
            <p className="text-muted-foreground">
                EmailThing is a new way to manage your email.
                You can use it to send and receive emails, and even create your own email addresses.
                We&lsquo;re excited to have you on board!
            </p>

            <Page githubStars={githubStars} action={changeBackupEmail} />
        </div>
    );
}
