import { notFound, redirect } from "next/navigation"
import { Form } from "./components.client"
import db, { User } from "@/db"
import { and, eq } from "drizzle-orm"
import type { Metadata } from "next"
import { cache } from "react"

export const revalidate = 60

export async function generateMetadata({ params }: { params: { username: string } }) {
    const user = await getUser(params.username)

    return {
        title: `Contact @${user.username}`,
        description: `Use this form to send a message to @${user.username}!`,
        openGraph: {
            siteName: "EmailThing.me",
            title: `Contact @${user.username}`,
            description: `Use this form to send a message to @${user.username}!`,
            images: [
                "https://emailthing.xyz/logo.png"
            ]
        },
        twitter: {
            title: `Contact @${user.username}`,
            description: `Use this form to send a message to @${user.username}!`,
            card: "summary",
            creator: "EmailThing_",
            images: [
                "https://emailthing.xyz/logo.png"
            ]
        },
        alternates: {
            canonical: `https://emailthing.me/@${user.username}`
        },
        robots: {
            index: false
        }
    } satisfies Metadata
}

const fetchUser = cache((username: string) => {
    return db.query.User.findFirst({
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
})

const getUser = async (username: string) => {
    if (!username.startsWith("%40")) return notFound()
    const _username = username.replace("%40", '')
    const user = await fetchUser(_username)
    if (!user) return notFound()
    if (_username != user.username) redirect(`./@${user.username}`)
    return user
}

export default async function ContactUserPage({ params }: { params: { username: string } }) {
    const user = await getUser(params.username)
    return (
        <main className="flex flex-col gap-5 container max-w-[65rem] py-11 sm:my-16 min-h-[calc(100vh-10.5rem)] sm:min-h-[calc(100vh-13rem)]">
            <h1 className="text-3xl sm:text-5xl font-bold text-center !leading-[1.5] pb-2">
                Get in touch with {" "}
                <span className="break-all text-wrap w-100 inline-block whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-br from-[#FF9797] to-[#6D6AFF]">
                    @{user.username}
                </span>
            </h1>
            <Form publicEmail={user.publicEmail || `${user.username}@emailthing.me`} username={user.username} />
        </main>
    )
}