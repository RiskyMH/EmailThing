import { db, UserSession } from "@/db";
import { generateRefreshToken, generateSessionToken } from "@/utils/token";
import { TOKEN_EXPIRES_IN } from "@emailthing/const/expiry";
import { and, eq, gt } from "drizzle-orm";
import { extractUserInfoHeader, isValidOrigin } from "../tools";

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

export async function POST(request: Request) {
    const origin = request.headers.get("origin");
    if (!origin || !isValidOrigin(origin)) {
        return new Response("Not allowed", { status: 403 });
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("refresh ")) {
        return Response.json(
            { error: "Invalid authorization header" },
            {
                status: 401,
                headers: {
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "authorization,content-type",
                    "Access-Control-Allow-Credentials": "false",
                    "Access-Control-Max-Age": "3600",
                },
            },
        );
    }

    const refreshToken = authHeader.slice("refresh ".length);
    if (!refreshToken) {
        return Response.json(
            { error: "No refresh token provided" },
            {
                status: 401,
                headers: {
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "authorization,content-type",
                    "Access-Control-Allow-Credentials": "false",
                    "Access-Control-Max-Age": "3600",
                },
            },
        );
    }

    try {
        // Get user from database
        const [user] = await db
            .select({ userId: UserSession.userId, id: UserSession.id })
            .from(UserSession)
            .where(and(eq(UserSession.refreshToken, refreshToken), gt(UserSession.refreshTokenExpiresAt, new Date())))
            .limit(1);

        if (!user) {
            return Response.json(
                { error: "User not found" },
                {
                    status: 401,
                    headers: {
                        "Access-Control-Allow-Origin": origin,
                        "Access-Control-Allow-Methods": "POST, OPTIONS",
                        "Access-Control-Allow-Headers": "authorization,content-type",
                        "Access-Control-Allow-Credentials": "false",
                        "Access-Control-Max-Age": "3600",
                    },
                },
            );
        }

        // Generate new tokens
        const newToken = generateSessionToken();
        const newRefreshToken = generateRefreshToken();

        const tokenExpiresAt = new Date(Date.now() + TOKEN_EXPIRES_IN);

        const sessionInfo = extractUserInfoHeader(request);

        await db
            .update(UserSession)
            .set({
                token: newToken,
                refreshToken: newRefreshToken,
                tokenExpiresAt,
                lastUsed: {
                    date: new Date(),
                    ip: sessionInfo.ip,
                    ua: sessionInfo.ua,
                    location: sessionInfo.location,
                },
            })
            .where(eq(UserSession.id, user.id));

        return Response.json(
            {
                token: newToken,
                refreshToken: newRefreshToken,
                tokenExpiresAt,
                userId: user.userId,
            },
            {
                status: 200,
                headers: {
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "authorization,content-type",
                    "Access-Control-Allow-Credentials": "false",
                    "Access-Control-Max-Age": "3600",
                },
            },
        );
    } catch (error) {
        console.error("Failed to refresh token:", error);
        return Response.json(
            { error: "Invalid refresh token" },
            {
                status: 401,
                headers: {
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "authorization,content-type",
                    "Access-Control-Allow-Credentials": "false",
                    "Access-Control-Max-Age": "3600",
                },
            },
        );
    }
}
