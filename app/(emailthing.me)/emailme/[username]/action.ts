"use server"

import db, { User } from "@/db"
import { env } from "@/utils/env"
import { and, eq } from "drizzle-orm"

const MAX_REQUESTS_PER_WINDOW = 5;
const WINDOW_DURATION_MS = 60 * 1000;

const ratelimit = new Map<string, { count: number, resetAt: Date }>();

export async function emailMeForm(_prevState: any, data: FormData): Promise<{ error?: string, success?: string } | void> {

    const username = data.get("username") as string
    const user = await db.query.User.findFirst({
        where: and(
            eq(User.username, username),
            eq(User.publicContactPage, true)
        ),
        columns: {
            username: true,
            email: true,
            publicEmail: true,
            id: true
        }
    })
    if (!user) return { error: "Can't find user to email" }

    const key = user.id;
    let rate = ratelimit.get(key);

    if (!rate || rate.resetAt < new Date()) {
        // Reset the rate limit if it's expired
        ratelimit.set(key, { count: 1, resetAt: new Date(Date.now() + WINDOW_DURATION_MS) });
    } else {
        // Increment the request count if within the window
        rate.count++;
        if (rate.count > MAX_REQUESTS_PER_WINDOW) {
            const timeUntilReset = rate.resetAt.getTime() - Date.now();
            return { error: "Too many requests. Please try again later." }
        }
    }


    const name = data.get("name") as string
    const email = data.get("email") as string
    const subject = data.get("subject") as string
    const message = data.get("message") as string

    if (!message) return { error: "You must provide a message" }

    const e = await fetch("https://email.riskymh.workers.dev", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-auth": env.EMAIL_AUTH_TOKEN
        } as Record<string, string>,
        body: JSON.stringify({
            personalizations: [
                {
                    to: [{ email: user.publicEmail || user.email }]
                },
            ],
            from: {
                email: "emailthing.me@emailthing.xyz",
                name: `${name || email || "Someone"} (emailthing.me)`
            },
            subject: subject ? `${subject} - EmailThing.me` : "New message from EmailThing.me",
            content: [
                {
                    type: "text/plain",
                    value:
                        `${message}

---

Sent from "${name || "*name not provided*"}" (${email || "*email not provided*"}) using your [EmailThing.me](https://emailthing.xyz/emailme/@${username}) contact form.
`
                }
            ],
            reply_to: {
                email,
                name
            }
        }),
    })

    if (!e.ok) {
        console.error(await e.text())
        return { error: "Failed to notify user" }
    }

    return { success: "Successfully sent your message!" }
}