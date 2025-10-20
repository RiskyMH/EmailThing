import { ResetPasswordToken, User, UserSession, db } from "@/db";
import { createId } from "@paralleldrive/cuid2";
import { and, eq, gt, not, sql } from "drizzle-orm";
import { createMimeMessage } from "mimetext";
import { sendEmail } from "@/utils/send-email";
import { isValidOrigin } from "../../tools";
import { createPasswordHash } from "@/utils/password";
import { userAuthSchema } from "@/utils/validations/auth";
import { marked } from "marked";
import { RESET_PASSWORD_TOKEN_EXPIRES_IN } from "@emailthing/const/expiry";
import { API_URL } from "@emailthing/const/urls";

// Rate limiting for password reset request phase (stricter)
const requestAttempts = new Map<string, number>();
const requestTimestamps = new Map<string, number>();
const REQUEST_MAX_ATTEMPTS = 3;
const REQUEST_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const REQUEST_LOCKOUT_MS = 30 * 60 * 1000; // 30 minutes

// Rate limiting for password reset phase (more lenient)
const resetAttempts = new Map<string, number>();
const resetTimestamps = new Map<string, number>();
const RESET_MAX_ATTEMPTS = 5;
const RESET_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RESET_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

// Rate limiting by user ID for reset phase
const userResetAttempts = new Map<string, number>();
const userResetTimestamps = new Map<string, number>();
const USER_RESET_MAX_ATTEMPTS = 8; // More attempts per user
const USER_RESET_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const USER_RESET_LOCKOUT_MS = 60 * 60 * 1000; // 1 hour

type ResponseBody = Record<string, unknown>;

export async function POST(request: Request) {
    const origin = request.headers.get("origin");
    if (!origin || !isValidOrigin(origin)) {
        return new Response("Not allowed", { status: 403 });
    }

    const ResponseJson = (body: ResponseBody, init?: ResponseInit) => {
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

        const body = await request.json();
        const { type = "request", username, token, password } = body;

        if (type === "request") {
            // Check if IP is in lockout for request phase
            const lastAttempt = requestTimestamps.get(ip) || 0;
            if (lastAttempt && now - lastAttempt < REQUEST_LOCKOUT_MS && (requestAttempts.get(ip) || 0) >= REQUEST_MAX_ATTEMPTS) {
                return ResponseJson({ error: "Too many reset attempts. Please try again later." }, { status: 429 });
            }

            // Reset attempts if window expired
            if (lastAttempt && now - lastAttempt > REQUEST_WINDOW_MS) {
                requestAttempts.delete(ip);
                requestTimestamps.delete(ip);
            }

            // Handle password reset request
            if (!username) {
                // Increment failed attempts
                requestAttempts.set(ip, (requestAttempts.get(ip) || 0) + 1);
                requestTimestamps.set(ip, now);
                return ResponseJson({ error: "Username is required" }, { status: 400 });
            }

            const user = await db.query.User.findFirst({
                where: eq(sql`lower(${User.username})`, sql`lower(${username})`),
                columns: {
                    id: true,
                    backupEmail: true,
                    username: true,
                }
            });

            if (!user?.backupEmail) {
                // Always return success even if user doesn't exist to prevent enumeration
                // But still increment attempts for rate limiting
                requestAttempts.set(ip, (requestAttempts.get(ip) || 0) + 1);
                requestTimestamps.set(ip, now);
                return ResponseJson({ success: true });
            }

            // Generate token and store in database
            const token = createId();
            await db
                .insert(ResetPasswordToken)
                .values({
                    token,
                    userId: user.id,
                    expiresAt: new Date(Date.now() + RESET_PASSWORD_TOKEN_EXPIRES_IN),
                    createdAt: new Date(),
                })
                .execute();

            // Send email
            const body = `Hello @${user.username},

You have requested to reset your password on EmailThing. Click the link below to reset your password:

https://emailthing.app/login/reset?token=${token}&username=${user.username}&api=${API_URL}

If you did not request this, please ignore this email.`
            const mail = createMimeMessage();
            mail.setSender({
                addr: "system@emailthing.app",
                name: "EmailThing System",
            });
            mail.setRecipient(user.backupEmail);
            mail.setSubject("Reset your password on EmailThing");
            mail.addMessage({
                contentType: "text/plain",
                data: body,
            });
            mail.addMessage({
                contentType: "text/html",
                data: marked.parse(body, { async: false }),
            });

            const emailResult = await sendEmail({
                from: "system@emailthing.app",
                to: [user.backupEmail],
                data: mail,
            });

            if (emailResult?.error) {
                return ResponseJson({ error: "Failed to send email" }, { status: 500 });
            }

            return ResponseJson({ success: true });
        }

        if (type === "reset") {
            // Check if IP is in lockout for reset phase
            const lastAttempt = resetTimestamps.get(ip) || 0;
            if (lastAttempt && now - lastAttempt < RESET_LOCKOUT_MS && (resetAttempts.get(ip) || 0) >= RESET_MAX_ATTEMPTS) {
                return ResponseJson({ error: "Too many password reset attempts. Please try again later." }, { status: 429 });
            }

            // Reset attempts if window expired for IP
            if (lastAttempt && now - lastAttempt > RESET_WINDOW_MS) {
                resetAttempts.delete(ip);
                resetTimestamps.delete(ip);
            }

            // Handle password reset with token
            if (!token || !password) {
                // Increment failed attempts
                resetAttempts.set(ip, (resetAttempts.get(ip) || 0) + 1);
                resetTimestamps.set(ip, now);
                return ResponseJson({ error: "Token and password are required" }, { status: 400 });
            }

            // Verify token is valid and not expired
            const reset = await db.query.ResetPasswordToken.findFirst({
                where: and(eq(ResetPasswordToken.token, token), gt(ResetPasswordToken.expiresAt, new Date())),
                columns: {
                    userId: true,
                },
            });

            if (!reset) {
                // Increment failed attempts
                resetAttempts.set(ip, (resetAttempts.get(ip) || 0) + 1);
                resetTimestamps.set(ip, now);
                return ResponseJson({ error: "Invalid or expired token" }, { status: 400 });
            }

            // Now check user-specific rate limiting
            const userId = reset.userId;
            const userLastAttempt = userResetTimestamps.get(userId) || 0;

            if (userLastAttempt && now - userLastAttempt < USER_RESET_LOCKOUT_MS &&
                (userResetAttempts.get(userId) || 0) >= USER_RESET_MAX_ATTEMPTS) {
                return ResponseJson({ error: "Too many password reset attempts for this account. Please try again later." }, { status: 429 });
            }

            // Reset user attempts if window expired
            if (userLastAttempt && now - userLastAttempt > USER_RESET_WINDOW_MS) {
                userResetAttempts.delete(userId);
                userResetTimestamps.delete(userId);
            }

            // Validate password using Zod schema
            const passwordValidation = userAuthSchema.shape.password.safeParse(password);
            if (!passwordValidation.success) {
                // Increment failed attempts for both IP and user
                resetAttempts.set(ip, (resetAttempts.get(ip) || 0) + 1);
                resetTimestamps.set(ip, now);
                userResetAttempts.set(userId, (userResetAttempts.get(userId) || 0) + 1);
                userResetTimestamps.set(userId, now);
                return ResponseJson({
                    error: passwordValidation.error.issues[0]?.message || "Password does not meet requirements"
                }, { status: 400 });
            }

            // Update password and delete token
            await db.batchUpdate([
                db
                    .update(User)
                    .set({
                        password: await createPasswordHash(password),
                    })
                    .where(eq(User.id, reset.userId)),

                db.delete(ResetPasswordToken).where(eq(ResetPasswordToken.token, token)),

                // Invalidate all sessions except the current one
                db.delete(UserSession).where(eq(UserSession.userId, reset.userId)),
            ]);

            // Success - reset rate limiting for this user and IP
            resetAttempts.delete(ip);
            resetTimestamps.delete(ip);
            userResetAttempts.delete(userId);
            userResetTimestamps.delete(userId);

            return ResponseJson({ success: true });
        }

        // If we get here, the type is invalid
        // Increment failed attempts for request (default)
        requestAttempts.set(ip, (requestAttempts.get(ip) || 0) + 1);
        requestTimestamps.set(ip, now);
        return ResponseJson({ error: "Invalid request type" }, { status: 400 });
    } catch (error) {
        console.error("Password reset error:", error);
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