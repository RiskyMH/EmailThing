import { changeBackupEmail } from "@/(user)/actions";
import { User, db } from "@/db";
import { getCurrentUser } from "@/utils/jwt";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Page } from "./components.client";

export const metadata = {
    title: {
        absolute: "Welcome to EmailThing",
    },
} satisfies Metadata;

export default async function WelcomePage() {
    const userId = await getCurrentUser();
    if (!userId) return redirect("/login?from=/settings");

    const user = await db.query.User.findFirst({
        where: eq(User.id, userId),
        columns: {
            id: true,
            username: true,
            email: true,
            onboardingStatus: true,
        },
    });
    if (!user) return notFound();
    // if (user.onboardingStatus?.initial) return redirect("/mail");

    const githubStars = (
        await (
            await fetch("https://api.github.com/repos/RiskyMH/EmailThing", {
                next: { revalidate: 60 },
            })
        ).json()
    ).stargazers_count;

    return (
        <div className="mx-auto mt-16 flex w-full flex-col gap-3 sm:w-[500px]">
            <h1 className="pb-2 text-center text-2xl">Welcome to EmailThing!</h1>
            <p className="text-muted-foreground">
                EmailThing is a new way to manage your email. You can use it to send and receive emails, and even create
                your own email addresses. We&lsquo;re excited to have you on board!
            </p>

            <Page githubStars={githubStars} action={changeBackupEmail} />
        </div>
    );
}
