import db, { MailboxAlias, MailboxTokens } from "@/db";
import { env } from "@/utils/env";
import { createVerify } from "crypto";
import { asc, eq } from "drizzle-orm";


const GITHUB_KEYS_URI = "https://api.github.com/meta/public_keys/secret_scanning";
export const revalidate = 0;

// export const runtime = "edge"

/**
 * Verify a payload and signature against a public key
 * @param payload the value to verify
 * @param signature the expected value
 * @param keyID the id of the key used to generated the signature
 */
const verify_signature = async (payload: string, signature: string, keyID: string) => {
    if (typeof payload !== "string" || payload.length === 0) {
        return { error: "Invalid payload" };
    }
    if (typeof signature !== "string" || signature.length === 0) {
        return { error: "Invalid signature" };
    }
    if (typeof keyID !== "string" || keyID.length === 0) {
        return { error: "Invalid keyID" };
    }

    const keys: Record<string, any> = await (await fetch(GITHUB_KEYS_URI, { next: { revalidate: 60 * 60 * 24 } })).json();

    if (!(keys?.public_keys instanceof Array) || keys.length === 0) {
        return { error: "No public keys found" };
    }

    const publicKey = keys.public_keys.find((k) => k.key_identifier === keyID) ?? null;
    if (publicKey === null) {
        return { error: "No public key found matching key identifier" };
    }

    const verify = createVerify("SHA256").update(payload);
    if (!verify.verify(publicKey.key, signature, "base64")) {
        return { error: "Signature does not match payload" };
    }

    return { success: true };
};


export async function POST(request: Request) {
    const payload = await request.text();
    const signature = request.headers.get("Github-Public-Key-Signature");
    const keyID = request.headers.get("Github-Public-Key-Identifier");


    const verify = await verify_signature(payload, signature!, keyID!);
    if (!verify.success) {
        return Response.json(verify, { status: 400 });
    }

    const json = JSON.parse(payload) as {
        token: string,
        type: string,
        url: string,
        source: string
    }[];

    for (const match of json) {
        const token = await db.query.MailboxTokens.findFirst({
            where: eq(MailboxTokens.token, match.token),
            columns: {
                token: true,
                mailboxId: true
            }
        });

        if (!token) {
            console.log(`Token "${match.token}" not found`)
            continue;
        }


        // get default mailbox alias and send email
        const [alias,] = await db.batch([
            db.query.MailboxAlias.findFirst({
                where: eq(MailboxAlias.mailboxId, token.mailboxId),
                columns: {
                    alias: true,
                    name: true
                },
                orderBy: asc(MailboxAlias.default)
            }),

            // invalidate it
            db.delete(MailboxTokens)
                .where(eq(MailboxTokens.token, match.token))
        ])
        // send email
        if (alias) {
            console.log(`Sending email to ${alias.alias} for token "${match.token}"`)
            const e = await fetch("https://email.riskymh.workers.dev", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-auth": env.EMAIL_AUTH_TOKEN
                } as Record<string, string>,
                body: JSON.stringify({
                    personalizations: [
                        {
                            to: [{ email: alias.alias }]
                        },
                    ],
                    from: {
                        email: "system@emailthing.xyz",
                        name: "EmailThing System"
                    },
                    subject: "Your token has been compromised",
                    content: [
                        {
                            type: "text/plain",
                            value:
                                `Hey, ${alias.name || alias.alias}!

It appears that the token for your mailbox has been posted to the internet. 
Luckily, GitHub has noticed and we have removed your token - hopefully before anyone could have maliciously used it!

Your token was found here: ${match.url}

Be more careful in the future, and make sure to not accidentally upload your token publicly!

Obtain a New Token: https://emailthing.xyz/mail/${token.mailboxId}/config

`
                        }
                    ]
                }),
            })



        } else {
            console.log(`No alias found for mailbox ${token.mailboxId}, but still invalidated token "${match.token}"`)
        }
    }

    return new Response("ok", { status: 200 });

}

// console.log(await verify_signature(
//     `[{"source":"commit","token":"some_token","type":"some_type","url":"https://example.com/base-repo-url/"}]`,
//     "MEQCIQDaMKqrGnE27S0kgMrEK0eYBmyG0LeZismAEz/BgZyt7AIfXt9fErtRS4XaeSt/AO1RtBY66YcAdjxji410VQV4xg==",
//     "bcb53661c06b4728e59d897fb6165d5c9cda0fd9cdf9d09ead458168deb7518c"
// ))
