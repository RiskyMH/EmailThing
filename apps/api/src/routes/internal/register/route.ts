import { db, InviteCode, Mailbox, MailboxAlias, MailboxForUser, User } from "@/db";
import { createPasswordHash } from "@/utils/password";
import { generateRefreshToken, generateSessionToken } from "@/utils/token";
import { userAuthSchema } from "@/utils/validations/auth";
import { validateAlias } from "@/utils/validations/sus-emails-checker";
import { REFRESH_TOKEN_EXPIRES_IN, TOKEN_EXPIRES_IN } from "@emailthing/const/expiry";
import { createId } from "@paralleldrive/cuid2";
import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { isValidOrigin } from "../tools";
import { emailUser } from "./tools";
import { storeSession } from "@/utils/redis-session";

// Rate limiting
const attempts = new Map<string, number>();
const timestamps = new Map<string, number>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 1.5 * 60 * 1000; // 1.5 minutes
const LOCKOUT_MS = 1 * 60 * 1000; // 1 minute

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
        const ip = (request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()) || "unknown";
        const now = Date.now();

        // Check if IP is in lockout
        const lastAttempt = timestamps.get(ip) || 0;
        if (lastAttempt && now - lastAttempt < LOCKOUT_MS && (attempts.get(ip) || 0) >= MAX_ATTEMPTS) {
            return ResponseJson({ error: "Too many register attempts. Please try again later." }, { status: 429 });
        }

        // Reset attempts if window expired
        if (lastAttempt && now - lastAttempt > WINDOW_MS) {
            attempts.delete(ip);
            timestamps.delete(ip);
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
            // Increment failed attempts
            attempts.set(ip, (attempts.get(ip) || 0) + 1);
            timestamps.set(ip, now);

            return ResponseJson({ error: parsedData.error.issues[0]?.message || "failed to parse data" }, { status: 400 });
        }

        const { username, password } = parsedData.data;
        const inviteCode = body.invite;

        if (!username || !password || !inviteCode) {
            // Increment failed attempts
            attempts.set(ip, (attempts.get(ip) || 0) + 1);
            timestamps.set(ip, now);

            return ResponseJson({ error: "uh? missing data" }, { status: 400 });
        }

        // check if invite code is valid
        const [invite] = await db
            .select({ expiresAt: InviteCode.expiresAt, usedAt: InviteCode.usedAt })
            .from(InviteCode)
            .where(and(eq(InviteCode.code, inviteCode), gte(InviteCode.expiresAt, new Date()), isNull(InviteCode.usedAt)))
            .limit(1);

        if (!invite) {
            // Increment failed attempts
            attempts.set(ip, (attempts.get(ip) || 0) + 1);
            timestamps.set(ip, now);

            return ResponseJson({ error: "Invalid invite code" }, { status: 401 });
        }

        const [existingUser] = await db
            .select()
            .from(User)
            .where(eq(sql`lower(${User.username})`, sql`lower(${parsedData.data.username})`))
            .limit(1);

        if (existingUser) {
            // Increment failed attempts
            attempts.set(ip, (attempts.get(ip) || 0) + 1);
            timestamps.set(ip, now);

            return ResponseJson({ error: "Username already taken" }, { status: 401 });
        }

        const validationError = validateAlias(parsedData.data.username);
        if (validationError) {
            // Increment failed attempts
            attempts.set(ip, (attempts.get(ip) || 0) + 1);
            timestamps.set(ip, now);
            return ResponseJson(validationError, { status: 401 });
        }

        // check email alaises too
        const [existingEmail] = await db
            .select()
            .from(MailboxAlias)
            .where(eq(sql`lower(${MailboxAlias.alias})`, sql`lower(${`${parsedData.data.username}@emailthing.xyz`})`))
            .limit(1);

        if (existingEmail) {
            // Increment failed attempts
            attempts.set(ip, (attempts.get(ip) || 0) + 1);
            timestamps.set(ip, now);

            return ResponseJson({ error: "Email already taken" }, { status: 401 });
        }

        // create user and their mailbox
        const userId = createId();
        const mailboxId = createId();

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
        ]);

        const token = generateSessionToken();
        const refreshToken = generateRefreshToken();

        const sess = await storeSession({
            session: {
                id: createId(),
                userId,
                lastUsed: { date: new Date().toISOString(), ip, ua: request.headers.get("user-agent") || "", location: "" },
                method: "password",
            },
            token,
            refreshToken,
        })

        // // Success - reset rate limiting
        // attempts.delete(ip);
        // timestamps.delete(ip);


        return ResponseJson({
            token,
            refreshToken,
            tokenExpiresAt: sess.tokenExpiresAt,
            refreshTokenExpiresAt: sess.refreshTokenExpiresAt,
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
