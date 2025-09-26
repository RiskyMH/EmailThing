import db, { Stats } from "@/db";
import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
// @ts-expect-error types not there :(
import { dkimSign } from "mailauth/lib/dkim/sign";
import type { MIMEMessage } from "mimetext";
import { env } from "./env";
import { todayDate } from "./tools";

export async function sendEmail(data: {
    from: string;
    to: string[];
    data: string | MIMEMessage;
    dkim?: { domain: string; selector?: string; privateKey: string };
    important?: boolean;
}) {
    // check if the "from" gives spf
    // use 1.1.1.1 doh api
    const domain = data.from.split("@")[1];
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=TXT`, {
        headers: {
            accept: "application/dns-json",
        },
    });
    const json = await res.json();

    const txtRecords = json?.Answer?.filter((a: any) => a.type === 16) || [];
    const allowed = txtRecords.some(
        (r: any) =>
            (r.data.includes("v=spf1") && r.data.includes("include:_spf.mx.emailthing.xyz")) ||
            r.data.includes("include:_spf.mx.emailthing.app"),
    );

    if (!allowed) {
        return {
            error: `Make sure "${domain}" gives EmailThing permission to send their emails`,
            link: "https://emailthing.app/docs/custom-domain#send-email",
        };
    }

    if (data.to.length > 50) {
        return {
            error: "Too many recipients, please ensure you have under 50.",
        };
    }

    if (typeof data.data !== "string" && "asRaw" in data.data) {
        data.data.setHeader("Message-ID", `<${createId()}@emailthing.app>`);
        data.data = data.data.asRaw();
    }

    // todo: ...
    if (!data.dkim) {
        if (domain === "emailthing.app" && env.EMAIL_DKIM_PRIVATE_KEY) {
            data.dkim = {
                domain: "emailthing.app", // d=
                selector: "rsa", // s=
                privateKey: env.EMAIL_DKIM_PRIVATE_KEY,
            };
        } else if (domain === "emailthing.xyz" && env.EMAIL_DKIM_PRIVATE_KEY) {
            data.dkim = {
                domain: "emailthing.xyz", // d=
                selector: "emailthing.rsa", // s=
                privateKey: env.EMAIL_DKIM_PRIVATE_KEY,
            };
        } else {
        }
    }

    const signedData = await withDKIM(data.data, data.dkim);
    const e = await fetch(`https://vps${data.important ? "1" : "2"}.riskymh.dev/api/send-email`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-auth": env.EMAIL_AUTH_TOKEN,
            Authorization: env.EMAIL_AUTH_TOKEN,
        } as Record<string, string>,
        body: JSON.stringify({
            from: data.from,
            to: data.to,
            data: signedData,
        }),
    });

    await db
        .insert(Stats)
        .values({
            time: todayDate(),
            value: 1,
            type: "send-email",
        })
        .onConflictDoUpdate({
            target: [Stats.time, Stats.type],
            set: { value: sql`${Stats.value} + 1` },
        })
        .execute();

    if (!e.ok) {
        console.error(await e.text());
        return { error: "Failed to send email" };
    }

    return { data: signedData };
}

export async function withDKIM(
    message: string,
    dkim?: { domain: string; selector?: string; privateKey: string },
): Promise<string> {
    // if already signed, no need to do again
    if (message.startsWith("DKIM-Signature: ")) {
        return message;
    }

    // todo: maybe be better and allow fallback, but i think its actually hurting the reputation
    if (!dkim) return message;

    const _message = `${message.replace(/\r?\n/g, "\r\n").trim()}\r\n`;

    const signResult = await dkimSign(_message, {
        canonicalization: "relaxed/relaxed", // c=
        // algorithm: 'rsa-sha256',
        // signTime: new Date(),

        signatureData: [
            {
                signingDomain: dkim?.domain || "emailthing.app", // d=
                selector: dkim?.selector || "emailthing", // s=
                privateKey: dkim?.privateKey || env.EMAIL_DKIM_PRIVATE_KEY,
                // algorithm: 'rsa-sha256',
                canonicalization: "relaxed/relaxed", // c=
            },
        ],
    });

    // show signing errors (if any)
    if (signResult.errors.length) {
        console.warn(signResult.errors);
        console.info("Not sending with DKIM");
        return message;
    }

    // return signResult.signatures + message.replace(/^\n+/, '')
    return signResult.signatures + _message;
}
