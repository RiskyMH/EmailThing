import db, { Stats } from "@/db"
import { env } from "./env"
import { sql } from "drizzle-orm"


export async function sendEmail(data: Record<string, any>) {
    const e = await fetch("https://email.riskymh.workers.dev", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-auth": env.EMAIL_AUTH_TOKEN
        } as Record<string, string>,
        body: JSON.stringify(data),
    })

    const date = new Date()
    await db.insert(Stats)
        .values({
            time: `${date.getFullYear()}-${date.getMonth()}-${date.getDay()}`,
            value: 1,
            type: "send-email"
        })
        .onConflictDoUpdate({
            target: Stats.time,
            set: { value: sql`excluded.value + 1` }
        })

    if (!e.ok) {
        console.error(await e.text())
        return { error: "Failed to send email" }
    }
}
