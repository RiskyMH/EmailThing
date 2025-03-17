import db, { MailboxTokens } from "@/db";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { headers } from "next/headers";

async function getToken() {
    const h = await headers();
    const auth = h.get("authorization");
    if (auth) return auth.replace("Bearer ", "");
    return h.get("x-auth");
}

export async function getTokenMailbox(): Promise<string | null> {
    const auth = await getToken();
    if (!auth) return null;

    const token = await db.query.MailboxTokens.findFirst({
        where: and(
            eq(MailboxTokens.token, auth),
            or(isNull(MailboxTokens.expiresAt), gt(MailboxTokens.expiresAt, new Date())),
            eq(MailboxTokens.isDeleted, false),
        ),
        columns: {
            id: true,
            mailboxId: true,
        },
    });

    return token?.mailboxId ?? null;
}
