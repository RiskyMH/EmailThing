import { createVerify } from "node:crypto";
import db, { MailboxAlias, MailboxTokens } from "@/db";
import { sendEmail } from "@/utils/send-email";
import { asc, eq } from "drizzle-orm";
import { createMimeMessage } from "mimetext";

const GITHUB_KEYS_URI = "https://api.github.com/meta/public_keys/secret_scanning";

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

    const keys: Record<string, any> = await (
        await fetch(GITHUB_KEYS_URI)
    ).json();

    if (!Array.isArray(keys?.public_keys) || keys.length === 0) {
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
        token: string;
        type: string;
        url: string;
        source: string;
    }[];

    for (const match of json) {
        const [token] = await db
            .select({ token: MailboxTokens.token, mailboxId: MailboxTokens.mailboxId })
            .from(MailboxTokens)
            .where(eq(MailboxTokens.token, match.token))
            .limit(1);

        if (!token) {
            continue;
        }

        // get default mailbox alias and send email
        const [[alias],] = await db.batchFetch([
            db
                .select({ alias: MailboxAlias.alias, name: MailboxAlias.name })
                .from(MailboxAlias)
                .where(eq(MailboxAlias.mailboxId, token.mailboxId))
                .orderBy(asc(MailboxAlias.default))
                .limit(1),

            // invalidate it
            db
                .delete(MailboxTokens)
                .where(eq(MailboxTokens.token, match.token)),
        ]);
        // send email
        if (alias) {
            const mail = createMimeMessage();
            mail.setSender({
                addr: "system@emailthing.app",
                name: "EmailThing System",
            });
            mail.setRecipient(alias.alias);
            mail.setSubject("Your token has been compromised");
            mail.addMessage({
                contentType: "text/plain",
                data: `Hey, ${alias.name || alias.alias}!

It appears that the token for your mailbox has been posted to the internet. 
Luckily, GitHub has noticed and we have removed your token - hopefully before anyone could have maliciously used it!

Your token was found here: ${match.url}

Be more careful in the future, and make sure to not accidentally upload your token publicly!

Obtain a New Token: https://emailthing.app/mail/${token.mailboxId}/config

`,
            });

            const e = await sendEmail({
                from: "system@emailthing.app",
                to: [alias.alias],
                data: mail,
            });
        } else {
        }
    }

    return new Response("ok", { status: 200 });
}

// console.log(await verify_signature(
//     `[{"source":"commit","token":"some_token","type":"some_type","url":"https://example.com/base-repo-url/"}]`,
//     "MEQCIQDaMKqrGnE27S0kgMrEK0eYBmyG0LeZismAEz/BgZyt7AIfXt9fErtRS4XaeSt/AO1RtBY66YcAdjxji410VQV4xg==",
//     "bcb53661c06b4728e59d897fb6165d5c9cda0fd9cdf9d09ead458168deb7518c"
// ))
