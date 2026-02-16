import { db, InviteCode, Mailbox, MailboxAlias, MailboxForUser, User, UserSession } from "@/db";
import { createPasswordHash } from "@/utils/password";
import { generateRefreshToken, generateSessionToken } from "@/utils/token";
import { userAuthSchema } from "@/utils/validations/auth";
import { validateAlias } from "@/utils/validations/sus-emails-checker";
import { REFRESH_TOKEN_EXPIRES_IN, TOKEN_EXPIRES_IN } from "@emailthing/const/expiry";
import { createId } from "@paralleldrive/cuid2";
import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { isValidOrigin } from "../tools";
import { emailUser } from "./tools";
import { registerCreateRatelimit, registerRatelimit, registerRatelimitLogFailed } from "@/utils/redis-ratelimit";
import { getSimplifiedIp } from "@/utils/ip";


export async function POST(request: Request) {
    const origin = request.headers.get("origin");
    if (!origin || !isValidOrigin(origin)) {
        return new Response("Not allowed", { status: 403 });
    }

    const ResponseJson = (body: any, init?: ResponseInit) => {
        return Response.json(body, {
            ...init,
            headers: {
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "authorization,content-type",
                "Access-Control-Allow-Credentials": "false",
                "Access-Control-Max-Age": "3600",
            },
        });
    };

    try {
        // Get IP for rate limiting
        const ip = getSimplifiedIp(request);
        const ratelimit = await registerRatelimit(ip);
        if (!ratelimit.allowed) {
            return ResponseJson(
                { error: "Too many login attempts. Please try again later." },
                { status: 429, headers: { "Retry-After": (ratelimit.retryAfter / 1000).toString() } }
            );
        }

        const body = await request.json();

        if (body.honeypot) {
            await Bun.sleep(Math.random() * 1500);
            return ResponseJson({
                token: "fake-token",
                refreshToken: "fake-refresh-token",
                tokenExpiresAt: new Date(Date.now() + TOKEN_EXPIRES_IN),
                refreshTokenExpiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN),
                mailboxes: [],
                userId: "fake-user-id",
            });
        }

        const parsedData = userAuthSchema.safeParse(body);
        if (!parsedData.success) {
            registerRatelimitLogFailed(ip);
            return ResponseJson({ error: parsedData.error.issues[0]?.message || "failed to parse data" }, { status: 400 });
        }

        const { username, password } = parsedData.data;
        const inviteCode = body.invite;

        if (!username || !password || !inviteCode) {
            registerRatelimitLogFailed(ip);
            return ResponseJson({ error: "uh? missing data" }, { status: 400 });
        }

        // check if invite code is valid
        const [invite] = await db
            .select({ expiresAt: InviteCode.expiresAt, usedAt: InviteCode.usedAt })
            .from(InviteCode)
            .where(and(eq(InviteCode.code, inviteCode), gte(InviteCode.expiresAt, new Date()), isNull(InviteCode.usedAt)))
            .limit(1);

        if (!invite) {
            registerRatelimitLogFailed(ip);
            return ResponseJson({ error: "Invalid invite code" }, { status: 401 });
        }

        const [existingUser] = await db
            .select()
            .from(User)
            .where(eq(sql`lower(${User.username})`, sql`lower(${parsedData.data.username})`))
            .limit(1);

        if (existingUser) {
            registerRatelimitLogFailed(ip);
            return ResponseJson({ error: "Username already taken" }, { status: 401 });
        }

        const validationError = validateAlias(parsedData.data.username);
        if (validationError) {
            registerRatelimitLogFailed(ip);
            return ResponseJson(validationError, { status: 401 });
        }

        // check email alaises too
        const [existingEmail] = await db
            .select()
            .from(MailboxAlias)
            .where(eq(sql`lower(${MailboxAlias.alias})`, sql`lower(${`${parsedData.data.username}@emailthing.xyz`})`))
            .limit(1);

        if (existingEmail) {
            registerRatelimitLogFailed(ip);
            return ResponseJson({ error: "Email already taken" }, { status: 401 });
        }

        const ratelimit2 = await registerCreateRatelimit(ip);
        if (!ratelimit2.allowed) {
            return ResponseJson(
                { error: "Too many login attempts. Please try again later." },
                { status: 429, headers: { "Retry-After": (ratelimit2.retryAfter / 1000).toString() } }
            );
        }

        // create user and their mailbox
        const userId = createId();
        const mailboxId = createId();

        const token = generateSessionToken();
        const refreshToken = generateRefreshToken();

        const tokenExpiresAt = new Date(Date.now() + TOKEN_EXPIRES_IN);
        const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN);

        await db.batchUpdate([
            db.insert(User).values({
                id: userId,
                username: parsedData.data.username,
                password: await createPasswordHash(parsedData.data.password),
                email: `${parsedData.data.username}@emailthing.xyz`,
            }),

            db.insert(Mailbox).values({
                id: mailboxId,
            }),

            db.insert(MailboxForUser).values({
                mailboxId,
                userId,
                role: "OWNER",
            }),

            db.insert(MailboxAlias).values({
                mailboxId,
                alias: `${parsedData.data.username}@emailthing.xyz`,
                default: true,
                name: parsedData.data.username,
            }),

            // invalidate invite code
            db
                .update(InviteCode)
                .set({
                    usedAt: new Date(),
                    usedBy: userId,
                })
                .where(eq(InviteCode.code, inviteCode)),

            ...emailUser({ userId, mailboxId, username: parsedData.data.username }),

            db.insert(UserSession).values({
                userId: userId,
                token,
                method: "password",
                refreshToken,
                tokenExpiresAt,
                refreshTokenExpiresAt,
            }),
        ]);

        // // Success - reset rate limiting
        // attempts.delete(ip);
        // timestamps.delete(ip);


        return ResponseJson({
            token,
            refreshToken,
            tokenExpiresAt,
            refreshTokenExpiresAt,
            mailboxes: [mailboxId],
            userId: userId,
        });
    } catch (error) {
        console.error("Register error:", error);
        return ResponseJson({ error: "Internal server error" }, { status: 500 });
    }
}

export function OPTIONS(request: Request) {
    const origin = request.headers.get("origin");
    if (!origin || !isValidOrigin(origin)) {
        return new Response("Not allowed", { status: 403 });
    }
    return new Response("OK", {
        headers: {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "authorization,content-type",
            "Access-Control-Allow-Credentials": "false",
            "Access-Control-Max-Age": "3600",
        },
    });
}
