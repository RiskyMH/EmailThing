import { db, MailboxForUser, PasskeyCredentials, User, UserSession } from "@/db";
import { verifyCredentialss } from "@/utils/passkeys";
import { verifyPassword } from "@/utils/password";
import { generateRefreshToken, generateSessionToken } from "@/utils/token";
import { userAuthSchema } from "@/utils/validations/auth";
import { REFRESH_TOKEN_EXPIRES_IN, TOKEN_EXPIRES_IN } from "@emailthing/const/expiry";
import { and, eq, sql } from "drizzle-orm";
import { isValidOrigin } from "../tools";
import { authRatelimit, authRatelimitLogFailed, authRatelimitSucceeded } from "@/utils/redis-ratelimit";
import { getSimplifiedIp } from "@/utils/ip";

const errorMsg = "Invalid username or password";

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
        const url = new URL(request.url);
        const type = url.searchParams.get("type") || "password" as "password" | "passkey";

        const body = await request.json();

        // ratelimiting!!
        const ip = getSimplifiedIp(request);
        const ratelimit = await authRatelimit(ip, body.username || body.credential?.id || undefined);
        if (!ratelimit.allowed) {
            return ResponseJson(
                { error: "Too many login attempts. Please try again later." },
                { status: 429, headers: { "Retry-After": (ratelimit.retryAfter / 1000).toString() } }
            );
        }

        if (body.honeypot) {
            await Bun.sleep(Math.random() * 1500);
            return ResponseJson({
                token: "fake-token",
                refreshToken: "fake-refresh-token",
                tokenExpiresAt: new Date(Date.now() + TOKEN_EXPIRES_IN),
                refreshTokenExpiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN),
                mailboxes: [],
                userId: "fake-user-id",
                userOnboarding: true,
            });
        }

        let userId: string | null = null;
        let userOnboarding = true;
        if (type === "password") {
            const parsedData = userAuthSchema.safeParse(body);
            if (!parsedData.success) {
                await authRatelimitLogFailed(ip);
                return ResponseJson({ error: errorMsg }, { status: 401 });
            }

            const { username, password } = parsedData.data;

            if (!username || !password) {
                await authRatelimitLogFailed(ip);
                return ResponseJson({ error: errorMsg }, { status: 400 });
            }

            // Find user
            const [user] = await db
                .select({ id: User.id, password: User.password, onboardingStatus: User.onboardingStatus })
                .from(User)
                .where(
                    eq(
                        sql`lower(${User.username})`,
                        sql`${username.toLowerCase()}`
                    )
                )
                .limit(1);

            if (!user) {
                await authRatelimitLogFailed(ip, username);
                return ResponseJson({ error: errorMsg }, { status: 401 });
            }

            userId = user.id;
            userOnboarding = user.onboardingStatus?.initial === true;

            // Verify password
            const valid = await verifyPassword(password, user.password);
            if (!valid) {
                await authRatelimitLogFailed(ip, username);
                return ResponseJson({ error: errorMsg }, { status: 401 });
            }

            if (typeof valid === "string") {
                // this is the new hash
                await db.update(User).set({ password: valid }).where(eq(User.id, user.id)).execute();
            }
        } else if (type === "passkey") {
            const credential = body.credential as Credential;
            const [cred] = await db
                .select()
                .from(PasskeyCredentials)
                .where(eq(PasskeyCredentials.credentialId, credential.id))
                .limit(1);
            if (cred == null) {
                await authRatelimitLogFailed(ip, credential.id);
                return ResponseJson({ error: "Passkey not found" }, { status: 401 });
            }

            let verification: Awaited<ReturnType<typeof verifyCredentialss>>;
            try {
                verification = await verifyCredentialss("login", credential, cred);
            } catch (error) {
                console.error(error);
                await authRatelimitLogFailed(ip, cred.userId);
                return ResponseJson({ error: "Failed to verify passkey :(" }, { status: 401 });
            }

            if (!verification.userVerified) {
                await authRatelimitLogFailed(ip, cred.userId);
                return ResponseJson({ error: "Failed to verify passkey" }, { status: 401 });
            }

            const [user] = await db
                .select({ id: User.id, onboardingStatus: User.onboardingStatus })
                .from(User)
                .where(eq(User.id, cred.userId))
                .limit(1);

            if (!user) {
                await authRatelimitLogFailed(ip, cred.userId);
                return ResponseJson({ error: "Can't find user" }, { status: 401 });
            }

            userId = user.id;
            userOnboarding = user.onboardingStatus?.initial === true;
        } else {
            await authRatelimitLogFailed(ip);
            return ResponseJson({ error: "Invalid login type" }, { status: 400 });
        }

        if (!userId) {
            await authRatelimitLogFailed(ip);
            return ResponseJson({ error: "Invalid login type" }, { status: 400 });
        }
        await authRatelimitSucceeded(ip, body.username || body.credential?.id || undefined);

        // const token = await createUserToken(user);
        const token = generateSessionToken();
        const refreshToken = generateRefreshToken();

        const tokenExpiresAt = new Date(Date.now() + TOKEN_EXPIRES_IN);
        const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN);

        const [mailboxes,] = await db.batchFetch([
            db
                .select({ mailboxId: MailboxForUser.mailboxId })
                .from(MailboxForUser)
                .where(and(eq(MailboxForUser.userId, userId), eq(MailboxForUser.isDeleted, false))),

            db.insert(UserSession).values({
                userId: userId,
                token,
                method: type,
                refreshToken,
                tokenExpiresAt,
                refreshTokenExpiresAt,
            }),
        ]);

        return ResponseJson({
            token,
            refreshToken,
            tokenExpiresAt,
            refreshTokenExpiresAt,
            mailboxes: mailboxes.map(({ mailboxId }) => mailboxId),
            userId: userId,
            userOnboarding,
        });
    } catch (error) {
        console.error("Login error:", error);
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
