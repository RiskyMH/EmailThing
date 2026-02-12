import { db, MailboxForUser, MailboxTokens, PasskeyCredentials } from "@/db";
import { and, eq } from "drizzle-orm";
import { UAParser } from "ua-parser-js";
import { getSession, isValidOrigin } from "../tools";
import { getSessionsByUserId } from "@/utils/redis-session";

export function OPTIONS(request: Request) {
    const origin = request.headers.get("origin");
    if (!origin || !isValidOrigin(origin)) {
        return new Response("Not allowed", { status: 403 });
    }
    return new Response("OK", {
        headers: {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "authorization,content-type",
            "Access-Control-Allow-Credentials": "false",
            "Access-Control-Max-Age": "3600",
        },
    });
}

export async function GET(request: Request) {
    const origin = request.headers.get("origin");
    if (!origin || !isValidOrigin(origin)) {
        return new Response("Not allowed", { status: 403 });
    }

    const type = new URL(request.url).searchParams.get("type")!;

    const headers = {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "authorization,content-type",
        "Access-Control-Allow-Credentials": "false",
        "Access-Control-Max-Age": "3600",
    };

    const currentUserid = await getSession(request);
    if (!currentUserid) return Response.json({ message: { error: "Unauthorized" } }, { status: 401, headers });

    if (type === "passkeys") {
        const passkeys = await db
            .select({
                id: PasskeyCredentials.id,
                userId: PasskeyCredentials.userId,
                createdAt: PasskeyCredentials.createdAt,
                name: PasskeyCredentials.name,
                isDeleted: PasskeyCredentials.isDeleted,
            })
            .from(PasskeyCredentials)
            .where(
                and(eq(PasskeyCredentials.userId, currentUserid), eq(PasskeyCredentials.isDeleted, false))
            );
        return Response.json(passkeys, { status: 200, headers });
    } else if (type === "sessions") {
        const sessions = await getSessionsByUserId(currentUserid);
        const uaParser = new UAParser();

        return Response.json(
            sessions.map((s) => {
                const browser = s?.lastUsed?.ua ? uaParser.setUA(s.lastUsed?.ua) : undefined;
                return {
                    ...s,
                    browser: browser ? `${browser.getOS().name} - ${browser.getBrowser().name}` : undefined,
                    location: s.lastUsed?.location,
                    lastUsed: undefined, // mainly so the ip doesn't leak to user... at least rn
                    token: undefined,
                    refreshToken: undefined,
                    lastUsedDate: s.lastUsed?.date,
                };
            }),
            { status: 200, headers },
        );
    } else if (type.startsWith("mailbox-token:")) {
        const mailboxId = type.slice("mailbox-token:".length);
        const [mailbox] = await db
            .select()
            .from(MailboxForUser)
            .where(
                and(
                    eq(MailboxForUser.mailboxId, mailboxId),
                    eq(MailboxForUser.userId, currentUserid),
                    eq(MailboxForUser.isDeleted, false)
                )
            )
            .limit(1);
        if (!mailbox) return Response.json({ message: { error: "Mailbox not found" } }, { status: 404, headers });

        const tokens = await db
            .select({
                id: MailboxTokens.id,
                mailboxId: MailboxTokens.mailboxId,
                createdAt: MailboxTokens.createdAt,
                expiresAt: MailboxTokens.expiresAt,
                token: MailboxTokens.token,
                name: MailboxTokens.name,
            })
            .from(MailboxTokens)
            .where(
                and(
                    eq(MailboxTokens.mailboxId, mailboxId),
                    eq(MailboxTokens.isDeleted, false)
                )
            );

        return Response.json(
            tokens.map((t) => ({ ...t, token: hideToken(t.token) })),
            { status: 200, headers },
        );
    }

    return Response.json({ message: { error: "Invalid type" } }, { status: 400, headers });
}

function hideToken(token: string) {
    const newToken = "et_";
    if (!token.startsWith(newToken)) return `${token.slice(0, 4)}......${token.slice(-4)}`;
    // show first 4 and last 4 characters
    return `${token.slice(0, newToken.length + 4)}......${token.slice(-4)}`;
}
