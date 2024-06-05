import { notFound, redirect } from "next/navigation"
import { Form } from "./components.client"
import { ClientInput, ClientTextarea } from "@/(user)/components.client"
import db, { User } from "@/db"
import { and, eq } from "drizzle-orm"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: { username: string } }) {
    const username = params.username.replace("%40", '')
    return {
        title: `Contact @${username}`,
        description: `Use this form to send a message to @${username}!`,
        openGraph: {
            siteName: "EmailThing.me",
            title: `Contact @${username}`,
            description: `Use this form to send a message to @${username}!`,
            images: [
                "https://emailthing.xyz/logo.png"
            ]
        },
        twitter: {
            title: `Contact @${username}`,
            description: `Use this form to send a message to @${username}!`,
            card: "summary",
            creator: "EmailThing_",
            images: [
                "https://emailthing.xyz/logo.png"
            ]
        },
        robots: {
            index: false
        }
    } satisfies Metadata
}

export default async function ContactUserPage({ params }: { params: { username: string } }) {
    if (!params.username.startsWith("%40")) return notFound()
    const username = params.username.replace("%40", '')

    const user = await db.query.User.findFirst({
        where: and(
            eq(User.username, username),
            eq(User.publicContactPage, true)
        ),
        columns: {
            username: true,
            email: true,
            publicEmail: true
        }
    })
    if (!user) return notFound()
    if (username != user.username) redirect(`./@${user.username}`)

    return (
        <main className="flex flex-col gap-5 container max-w-[65rem] py-11 sm:my-16 min-h-[calc(100vh-10.5rem)] sm:min-h-[calc(100vh-13rem)]">
            <h1 className="text-3xl sm:text-5xl font-bold text-center !leading-[1.5] pb-2">
                Get in touch with {" "}
                <span className="break-all text-wrap w-100 inline-block whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-br from-[#FF9797] to-[#6D6AFF]">
                    @{user.username}
                </span>
            </h1>
            <Form publicEmail={user.publicEmail || `${username}@emailthing.me`}  username={user.username} />
        </main>
    )
}