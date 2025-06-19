import db, { MailboxTokens } from "@/db";
import { and, eq, gt, isNull, or } from "drizzle-orm";

async function getToken(headers: Headers) {
    // const h = await headers();
    const auth = headers.get("authorization");
    if (auth) return auth.replace("Bearer ", "");
    return headers.get("x-auth");
}

export async function getTokenMailbox(headers: Headers): Promise<string | null> {
    const auth = await getToken(headers);
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
