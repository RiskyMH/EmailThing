import { verifyPassword } from "@/utils/password";
import { db, MailboxForUser, PasskeyCredentials, UserSession } from "@/db";
import { User } from "@/db";
import { and, eq, sql } from "drizzle-orm";
import { userAuthSchema } from "@/utils/validations/auth";
import { isValidOrigin } from "../tools";
import { generateSessionToken, generateRefreshToken } from "@/utils/token";
import { verifyCredentialss } from "@/utils/passkeys";
import { TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } from "@emailthing/const/expiry";

const errorMsg = "Invalid username or password";

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
        const ip = request.headers.get("x-forwarded-for") || "unknown";
        const now = Date.now();

        // Check if IP is in lockout
        const lastAttempt = timestamps.get(ip) || 0;
        if (lastAttempt && now - lastAttempt < LOCKOUT_MS && (attempts.get(ip) || 0) >= MAX_ATTEMPTS) {
            return ResponseJson({ error: "Too many login attempts. Please try again later." }, { status: 429 });
        }

        // Reset attempts if window expired
        if (lastAttempt && now - lastAttempt > WINDOW_MS) {
            attempts.delete(ip);
            timestamps.delete(ip);
        }

        const url = new URL(request.url);
        const type = url.searchParams.get("type") || "password" as "password" | "passkey";

        const body = await request.json();

        let userId: string | null = null;
        let userOnboarding = true;
        if (type === "password") {
            const parsedData = userAuthSchema.safeParse(body);
            if (!parsedData.success) {
                // Increment failed attempts
                attempts.set(ip, (attempts.get(ip) || 0) + 1);
                timestamps.set(ip, now);

                return ResponseJson({ error: errorMsg }, { status: 401 });
            }

            const { username, password } = parsedData.data;

            if (!username || !password) {
                // Increment failed attempts
                attempts.set(ip, (attempts.get(ip) || 0) + 1);
                timestamps.set(ip, now);

                return ResponseJson({ error: errorMsg }, { status: 400 });
            }

            // Find user
            const user = await db.query.User.findFirst({
                where: eq(sql`lower(${User.username})`, sql`lower(${parsedData.data.username})`),
                columns: {
                    id: true,
                    password: true,
                    onboardingStatus: true,
                },
            });

            if (!user) {
                // Increment failed attempts
                attempts.set(ip, (attempts.get(ip) || 0) + 1);
                timestamps.set(ip, now);

                return ResponseJson({ error: errorMsg }, { status: 401 });
            }

            userId = user.id;
            userOnboarding = user.onboardingStatus?.initial === true;

            // Verify password
            const valid = await verifyPassword(password, user.password);
            if (!valid) {
                // Increment failed attempts
                attempts.set(ip, (attempts.get(ip) || 0) + 1);
                timestamps.set(ip, now);

                return ResponseJson({ error: errorMsg }, { status: 401 });
            }

            if (typeof valid === "string") {
                // this is the new hash
                await db.update(User).set({ password: valid }).where(eq(User.id, user.id)).execute();
            }
        } else if (type === "passkey") {
            const credential = body.credential as Credential;
            const cred = await db.query.PasskeyCredentials.findFirst({
                where: eq(PasskeyCredentials.credentialId, credential.id),
            });
            if (cred == null) {
                // Increment failed attempts
                attempts.set(ip, (attempts.get(ip) || 0) + 1);
                timestamps.set(ip, now);

                return ResponseJson({ error: "Passkey not found" }, { status: 401 });
            }

            let verification: Awaited<ReturnType<typeof verifyCredentialss>>;
            try {
                verification = await verifyCredentialss("login", credential, cred);
            } catch (error) {
                console.error(error);
                // Increment failed attempts
                attempts.set(ip, (attempts.get(ip) || 0) + 1);
                timestamps.set(ip, now);

                return ResponseJson({ error: "Failed to verify passkey :(" }, { status: 401 });
            }

            if (!verification.userVerified) {
                // Increment failed attempts
                attempts.set(ip, (attempts.get(ip) || 0) + 1);
                timestamps.set(ip, now);

                return ResponseJson({ error: "Failed to verify passkey" }, { status: 401 });
            }

            const user = await db.query.User.findFirst({
                where: eq(User.id, cred.userId),
                columns: {
                    id: true,
                    onboardingStatus: true,
                },
            });

            if (!user) {
                // Increment failed attempts
                attempts.set(ip, (attempts.get(ip) || 0) + 1);
                timestamps.set(ip, now);

                return ResponseJson({ error: "Can't find user" }, { status: 401 });
            }

            userId = user.id;
            userOnboarding = user.onboardingStatus?.initial === true;
        } else {
            // Increment failed attempts
            attempts.set(ip, (attempts.get(ip) || 0) + 1);
            timestamps.set(ip, now);

            return ResponseJson({ error: "Invalid login type" }, { status: 400 });
        }

        if (!userId) {
            // Increment failed attempts
            attempts.set(ip, (attempts.get(ip) || 0) + 1);
            timestamps.set(ip, now);

            return ResponseJson({ error: "Invalid login type" }, { status: 400 });
        }

        // Success - reset rate limiting
        attempts.delete(ip);
        timestamps.delete(ip);

        // const token = await createUserToken(user);
        const token = generateSessionToken();
        const refreshToken = generateRefreshToken();

        const tokenExpiresAt = new Date(Date.now() + TOKEN_EXPIRES_IN);
        const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN);

        const [mailboxes, _] = await db.batchFetch([
            db.query.MailboxForUser.findMany({
                where: and(eq(MailboxForUser.userId, userId), eq(MailboxForUser.isDeleted, false)),
                columns: { mailboxId: true },
            }),
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
