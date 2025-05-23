import { db, UserSession } from "@/db";
import { eq } from "drizzle-orm";
import { isValidOrigin } from "../tools";

export function OPTIONS(request: Request) {
    const origin = request.headers.get("origin");
    if (!origin || !isValidOrigin(origin)) {
        return new Response("Not allowed", { status: 403 });
    }
    return new Response("OK", {
        headers: {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "authorization",
            "Access-Control-Allow-Credentials": "true",
        },
    });
}

export async function DELETE(request: Request) {
    const origin = request.headers.get("origin");
    if (!origin || !isValidOrigin(origin)) {
        return new Response("Not allowed", { status: 403 });
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
        return Response.json(
            { error: "No authorization header" },
            {
                status: 401,
                headers: {
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Methods": "DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "authorization",
                    "Access-Control-Allow-Credentials": "true",
                },
            },
        );
    } else if (authHeader.startsWith("refresh ")) {
        await db.delete(UserSession).where(eq(UserSession.refreshToken, authHeader.slice("refresh ".length)));
        return Response.json(
            { error: "Removed refresh token if it was found" },
            {
                status: 200,
                headers: {
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Methods": "DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "authorization",
                    "Access-Control-Allow-Credentials": "true",
                },
            },
        );
    } else if (authHeader.startsWith("session ")) {
        await db.delete(UserSession).where(eq(UserSession.token, authHeader.slice("session ".length)));
        return Response.json(
            { error: "Removed session token if it was found" },
            {
                status: 200,
                headers: {
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Methods": "DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "authorization",
                    "Access-Control-Allow-Credentials": "true",
                },
            },
        );
    }

    return Response.json(
        { error: "Invalid authorization header" },
        {
            status: 401,
            headers: {
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Methods": "DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "authorization",
                "Access-Control-Allow-Credentials": "true",
            },
        },
    );
}
