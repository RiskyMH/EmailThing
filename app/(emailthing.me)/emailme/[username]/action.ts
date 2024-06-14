"use server"

import db, { User } from "@/db"
import { env } from "@/utils/env"
import { sendEmail } from "@/utils/send-email";
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers";

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

    // turnstile verify user
    if (env.TURNSTILE_SECRET_KEY) {
        const formData = new FormData()
        // formData.append("secret", "1x0000000000000000000000000000000AA")
        formData.append("secret", env.TURNSTILE_SECRET_KEY)
        formData.append("response", data.get("cf-turnstile-response") as string)
        formData.append("remoteip", headers().get("CF-Connecting-IP") as string)

        const turnstile = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: 'POST',
            body: formData,
        })

        const result = await turnstile.json()
        console.log(result)
        if (!result.success) {
            return { error: "Failed turnstile recapture test" }
        }
        // return { success: "test done" }
    } else {
        console.warn("No turnstile setup, allowing request")
    }

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

    const e = await sendEmail({
        personalizations: [
            {
                to: [{ email: user.publicEmail || user.email }]
            },
        ],
        from: {
            email: `${username}@emailthing.me`,
            name: `${name || email || "Someone"} (emailthing.me)`
        },
        subject: subject ? `${subject} - EmailThing.me` : "New message from EmailThing.me",
        content: [
            {
                type: "text/plain",
                value:
                    `${message}

---

Sent from "${name || "*name not provided*"}" (${email || "*email not provided*"}) using your [EmailThing.me](https://emailthing.me/@${username}) contact form.
`
            }
        ],
        reply_to: email ? ({ email, name }) : undefined
    })

    if (e?.error) return { error: "Failed to notify user" }

    return { success: "Successfully sent your message!" }
}