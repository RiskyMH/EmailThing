import db, { MailboxTokens } from "@/db";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

function getToken() {
    const h = headers();
    const auth = h.get("authorization");
    if (auth) return auth.replace("Bearer ", "");
    return h.get("x-auth");
}

export async function getTokenMailbox(): Promise<string | null> {
    const auth = getToken();
    if (!auth) return null

    const token = await db.query.MailboxTokens.findFirst({
        where: eq(MailboxTokens.token, auth),
        columns: {
            id: true,
            mailboxId: true
        }
    })

    return token?.mailboxId ?? null
}