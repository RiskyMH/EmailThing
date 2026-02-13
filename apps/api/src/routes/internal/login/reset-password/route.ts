import { db, User } from "@/db";
import { createPasswordHash } from "@/utils/password";
import { sendEmail } from "@/utils/send-email";
import { userAuthSchema } from "@/utils/validations/auth";
import { API_URL } from "@emailthing/const/urls";
import { createId } from "@paralleldrive/cuid2";
import { eq, sql } from "drizzle-orm";
import { marked } from "marked";
import { createMimeMessage } from "mimetext";
import { isValidOrigin } from "../../tools";
import { logResetPasswordChangeFailed, logResetPasswordRequestFailed, resetPasswordRatelimitChange, resetPasswordRatelimitRequest } from "@/utils/redis-ratelimit";
import { getResetPasswordToken, invalidateAllResetPasswordTokensForUser, setResetPasswordToken } from "@/utils/redis-minor";
import { getSimplifiedIp } from "@/utils/ip";

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
        const ip = getSimplifiedIp(request);
        const body = await request.json();
        const { type = "request", username, token, password } = body;

        if (type === "request") {
            const ratelimit = await resetPasswordRatelimitRequest(ip, username);
            if (!ratelimit.allowed) {
                return ResponseJson(
                    { error: "Too many reset attempts. Please try again later." },
                    { status: 429, headers: { "Retry-After": (ratelimit.retryAfter / 1000).toString() } }
                );
            }

            // Handle password reset request
            if (!username) {
                await logResetPasswordRequestFailed(ip);
                return ResponseJson({ error: "Username is required" }, { status: 400 });
            }

            const [user] = await db
                .select({ id: User.id, backupEmail: User.backupEmail, username: User.username })
                .from(User)
                .where(eq(sql`lower(${User.username})`, sql`lower(${username})`))
                .limit(1);

            if (!user?.backupEmail) {
                // Always return success even if user doesn't exist to prevent enumeration
                // But still increment attempts for rate limiting
                await logResetPasswordRequestFailed(ip, username);
                return ResponseJson({ success: true });
            }

            // Generate token and store in database
            const token = createId();
            await setResetPasswordToken(user.id, token);

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
            const ratelimit = await resetPasswordRatelimitChange(ip);
            if (!ratelimit.allowed) {
                return ResponseJson(
                    { error: "Too many password reset attempts. Please try again later." },
                    { status: 429, headers: { "Retry-After": (ratelimit.retryAfter / 1000).toString() } }
                );
            }

            // Verify token is valid and not expired
            const userId = await getResetPasswordToken(token);
            if (!userId) {
                // Increment failed attempts
                await logResetPasswordChangeFailed(ip);
                return ResponseJson({ error: "Invalid or expired token" }, { status: 400 });
            }

            // Validate password using Zod schema
            const passwordValidation = userAuthSchema.shape.password.safeParse(password);
            if (!passwordValidation.success) {
                await logResetPasswordChangeFailed(ip);
                return ResponseJson({
                    error: passwordValidation.error.issues[0]?.message || "Password does not meet requirements"
                }, { status: 400 });
            }

            // Update password and delete token
            await db
                .update(User)
                .set({
                    password: await createPasswordHash(password),
                })
                .where(eq(User.id, userId));
            await invalidateAllResetPasswordTokensForUser(userId);

            return ResponseJson({ success: true });
        }

        await logResetPasswordRequestFailed(ip);
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