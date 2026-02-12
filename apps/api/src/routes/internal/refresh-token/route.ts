import { db } from "@/db";
import { generateRefreshToken, generateSessionToken } from "@/utils/token";
import { TOKEN_EXPIRES_IN } from "@emailthing/const/expiry";
import { and, eq, gt } from "drizzle-orm";
import { extractUserInfoHeader, isValidOrigin } from "../tools";
import { getSessionByRefreshToken, getSessionIdByRefreshToken, renewSessionTokens } from "@/utils/redis-session";

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
        const sessionId = await getSessionIdByRefreshToken(refreshToken);

        if (!sessionId) {
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
        const sessionInfo = extractUserInfoHeader(request);
        const session = await renewSessionTokens(sessionId, newToken, newRefreshToken, sessionInfo);



        return Response.json(
            {
                token: newToken,
                refreshToken: newRefreshToken,
                tokenExpiresAt: session.tokenExpiresAt,
                userId: session.userId,
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
