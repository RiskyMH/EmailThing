import { db, UserSession } from "@/db";
import { eq } from "drizzle-orm";
import { isValidOrigin } from "../tools";
import { deleteSessionTokenLastUse } from "@/utils/redis-minor";

export function OPTIONS(request: Request) {
    const origin = request.headers.get("origin");
    if (!origin || !isValidOrigin(origin)) {
        return new Response("Not allowed", { status: 403 });
    }
    return new Response("OK", {
        headers: {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "authorization,content-type",
            "Access-Control-Allow-Credentials": "false",
            "Access-Control-Max-Age": "3600",
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
                    "Access-Control-Allow-Headers": "authorization,content-type",
                    "Access-Control-Allow-Credentials": "false",
                    "Access-Control-Max-Age": "3600",
                },
            },
        );
    } else if (authHeader.startsWith("refresh ")) {
        const result = await db
            .delete(UserSession)
            .where(eq(UserSession.refreshToken, authHeader.slice("refresh ".length)))
            .returning();
        await Promise.all(result.map((r) => deleteSessionTokenLastUse(r.id)));

        return Response.json(
            { error: "Removed refresh token if it was found" },
            {
                status: 200,
                headers: {
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Methods": "DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "authorization,content-type",
                    "Access-Control-Allow-Credentials": "false",
                    "Access-Control-Max-Age": "3600",
                },
            },
        );
    } else if (authHeader.startsWith("session ")) {
        const result = await db
            .delete(UserSession)
            .where(eq(UserSession.token, authHeader.slice("session ".length)))
            .returning();
        await Promise.all(result.map((r) => deleteSessionTokenLastUse(r.id)));

        return Response.json(
            { error: "Removed session token if it was found" },
            {
                status: 200,
                headers: {
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Methods": "DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "authorization,content-type",
                    "Access-Control-Allow-Credentials": "false",
                    "Access-Control-Max-Age": "3600",
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
                "Access-Control-Allow-Headers": "authorization,content-type",
                "Access-Control-Allow-Credentials": "false",
                "Access-Control-Max-Age": "3600",
            },
        },
    );
}
