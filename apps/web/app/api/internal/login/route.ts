import { NextResponse } from "next/server";
import { verifyPassword } from "@/utils/password";
import { db, MailboxForUser, UserSession } from "@/db";
import { User } from "@/db";
import { eq } from "drizzle-orm";
import { userAuthSchema } from "@/validations/auth";
import { createUserToken } from "@/utils/jwt";
import { isValidOrigin } from "../tools";
import { generateSessionToken, generateRefreshToken } from "@/utils/token";

const errorMsg = "Invalid username or password";

// Rate limiting
const attempts = new Map<string, number>();
const timestamps = new Map<string, number>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 1.5 * 60 * 1000; // 1.5 minutes
const LOCKOUT_MS = 1 * 60 * 1000; // 1 minute

export async function POST(request: Request) {
    const origin = request.headers.get("origin");
    if (!origin || !isValidOrigin(origin)) {
        return new Response("Not allowed", { status: 403 });
    }

    const ResponseJson = (body: any, init?: ResponseInit) => {
        return NextResponse.json(body, {
            ...init,
            headers: {
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "authorization",
                "Access-Control-Allow-Credentials": "true",
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

        const body = await request.json();

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
            where: eq(User.username, parsedData.data.username),
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

        // Success - reset rate limiting
        attempts.delete(ip);
        timestamps.delete(ip);

        // const token = await createUserToken(user);
        const token = generateSessionToken();
        const refreshToken = generateRefreshToken();

        const tokenExpiresAt = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
        const refreshTokenExpiresAt = new Date(Date.now() + 1 * 365 * 24 * 60 * 60 * 1000);

        const [mailboxes, _] = await db.batchFetch([
            db.query.MailboxForUser.findMany({
                where: eq(MailboxForUser.userId, user.id),
                columns: { mailboxId: true },
            }),
            db.insert(UserSession).values({
                userId: user.id,
                token,
                method: "password",
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
            userId: user.id,
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
            "Access-Control-Allow-Headers": "authorization",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "3600",
        },
    });
}
