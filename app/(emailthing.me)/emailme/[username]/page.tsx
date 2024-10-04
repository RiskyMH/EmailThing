import db, { User } from "@/db";
import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { Form } from "./components.client";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { username: string } }) {
    const user = await getUser(params.username);

    return {
        title: `Contact @${user.username}`,
        description: `Use this form to send a message to @${user.username}!`,
        openGraph: {
            siteName: "EmailThing.me",
            title: `Contact @${user.username}`,
            description: `Use this form to send a message to @${user.username}!`,
            images: ["https://emailthing.app/logo.png"],
        },
        twitter: {
            title: `Contact @${user.username}`,
            description: `Use this form to send a message to @${user.username}!`,
            card: "summary",
            creator: "EmailThing_",
            images: ["https://emailthing.app/logo.png"],
        },
        alternates: {
            canonical: `https://emailthing.me/@${user.username}`,
        },
        robots: {
            index: false,
        },
    } satisfies Metadata;
}

const fetchUser = cache((username: string) => {
    return db.query.User.findFirst({
        where: and(eq(User.username, username), eq(User.publicContactPage, true)),
        columns: {
            username: true,
            email: true,
            publicEmail: true,
        },
    });
});

const getUser = async (username: string) => {
    if (!username.startsWith("%40")) return notFound();
    const _username = username.replace("%40", "");
    const user = await fetchUser(_username);
    if (!user) return notFound();
    if (_username !== user.username) redirect(`./@${user.username}`);
    return user;
};

export default async function ContactUserPage({ params }: { params: { username: string } }) {
    const user = await getUser(params.username);
    return (
        <main className="container flex min-h-[calc(100vh-10.5rem)] max-w-[65rem] flex-col gap-5 py-11 sm:my-16 sm:min-h-[calc(100vh-13rem)]">
            <h1 className="!leading-[1.5] pb-2 text-center font-bold text-3xl sm:text-5xl">
                Get in touch with{" "}
                <span className="inline-block whitespace-nowrap text-wrap break-all bg-gradient-to-br from-[#FF9797] to-[#6D6AFF] bg-clip-text text-transparent">
                    @{user.username}
                </span>
            </h1>
            <Form publicEmail={user.publicEmail || `${user.username}@emailthing.me`} username={user.username} />
        </main>
    );
}
