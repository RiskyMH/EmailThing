import { db, UserSession, PasskeyCredentials, MailboxForUser, MailboxTokens } from "@/db";
import { eq, and } from "drizzle-orm";
import { isValidOrigin, getSession } from "../tools";
import { UAParser } from "ua-parser-js";

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
        const passkeys = await db.query.PasskeyCredentials.findMany({
            where: and(eq(PasskeyCredentials.userId, currentUserid), eq(PasskeyCredentials.isDeleted, false)),
            columns: {
                id: true,
                userId: true,
                credentialId: false,
                createdAt: true,
                name: true,
                publicKey: false,
                isDeleted: true,
            },
        });
        return Response.json(passkeys, { status: 200, headers });
    } else if (type === "sessions") {
        const sessions = await db.query.UserSession.findMany({
            where: eq(UserSession.userId, currentUserid),
            columns: {
                id: true,
                userId: true,
                createdAt: true,
                tokenExpiresAt: true,
                token: false,
                refreshToken: false,
                method: true,
                sudoExpiresAt: true,
                lastUsed: true,
                refreshTokenExpiresAt: true,
            },
        });

        const uaParser = new UAParser();

        return Response.json(
            sessions.map((s) => {
                const browser = s?.lastUsed?.ua ? uaParser.setUA(s.lastUsed?.ua) : undefined;
                return {
                    ...s,
                    browser: browser ? `${browser.getOS().name} - ${browser.getBrowser().name}` : undefined,
                    location: s.lastUsed?.location,
                    lastUsed: undefined, // mainly so the ip doesn't leak to user... at least rn
                    lastUsedDate: s.lastUsed?.date,
                };
            }),
            { status: 200, headers },
        );
    } else if (type.startsWith("mailbox-token:")) {
        const mailboxId = type.slice("mailbox-token:".length);
        const mailbox = await db.query.MailboxForUser.findFirst({
            where: and(eq(MailboxForUser.mailboxId, mailboxId), eq(MailboxForUser.userId, currentUserid)),
        });
        if (!mailbox) return Response.json({ message: { error: "Mailbox not found" } }, { status: 404, headers });

        const tokens = await db.query.MailboxTokens.findMany({
            where: and(eq(MailboxTokens.mailboxId, mailboxId), eq(MailboxTokens.isDeleted, false)),
            columns: {
                id: true,
                mailboxId: true,
                createdAt: true,
                expiresAt: true,
                token: true, // going to need to anonymize this
                name: true,
            },
        });

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
