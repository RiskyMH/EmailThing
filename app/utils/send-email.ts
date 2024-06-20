import db, { Stats } from "@/db"
import { env } from "./env"
import { sql } from "drizzle-orm"
import { todayDate } from "./tools"


export async function sendEmail(data: { from: string, to: string[], data: string, dkim?: { domain: string, selector?: string, privateKey: string } }) {
    // check if the "from" gives spf
    // use 1.1.1.1 doh api
    const domain = data.from.split("@")[1]
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=TXT`, {
        headers: {
            "accept": "application/dns-json",
        },
        next: {
            revalidate: 60
        }
    });
    const json = await res.json();

    const txtRecords = json?.Answer?.filter((a: any) => a.type === 16) || [];
    const allowed = txtRecords.some((r: any) => r.data.includes("v=spf1") && r.data.includes("include:_spf.mx.emailthing.xyz"));

    if (!allowed) {
        return {
            error: `Make sure "${domain}" gives EmailThing permission to send their emails`,
            link: "https://emailthing.xyz/docs/custom-domain#send-email"
        }
    }

    if (data.to.length > 50) {
        return { error: "Too many recipients, please ensure you have under 50." }
    }

    const e = await fetch("https://vps2.riskymh.dev/api/send-email", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-auth": env.EMAIL_AUTH_TOKEN,
            "Authorization": env.EMAIL_AUTH_TOKEN
        } as Record<string, string>,
        body: JSON.stringify(data),
    })

    await db.insert(Stats)
        .values({
            time: todayDate(),
            value: 1,
            type: "send-email"
        })
        .onConflictDoUpdate({
            target: [Stats.time, Stats.type],
            set: { value: sql`${Stats.value} + 1` }
        })
        .execute()

    if (!e.ok) {
        console.error(await e.text())
        return { error: "Failed to send email" }
    }
}
