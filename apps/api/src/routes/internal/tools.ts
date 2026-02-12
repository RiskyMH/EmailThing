import { db, UserSession } from "@/db";
import { setSessionTokenLastUse } from "@/utils/redis-minor";
import { and, eq, gte } from "drizzle-orm";

export const allowedOrigins = [
    "https://emailthing.app",
    "https://pwa.emailthing.app",
    "https://api.emailthing.app",
    "https://*.emailthing.app",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:1234",
    "https://emailthing.pages.dev",
    "https://*.emailthing.pages.dev",
];

export const isValidOrigin = (origin: string) => {
    if (origin.endsWith(".emailthing.pages.dev") || origin.endsWith(".emailthing.app")) {
        return true;
    }
    return allowedOrigins.includes(origin);
};

export const getSession = async (request: Request, sudo = false, allowSearchParamExtract = false) => {
    let authHeader = request.headers.get("authorization");
    if (!authHeader && allowSearchParamExtract) {
        const url = new URL(request.url);
        authHeader = url.searchParams.get("session");
        if (authHeader) authHeader = `session ${authHeader}`;
    }
    if (!authHeader?.startsWith("session ")) return null;
    const token = authHeader.split(" ")[1];
    if (!token) return null;

    const [sessionToken] = await db
        .select({ id: UserSession.id, userId: UserSession.userId, tokenExpiresAt: UserSession.tokenExpiresAt })
        .from(UserSession)
        .where(and(
            eq(UserSession.token, token),
            gte(UserSession.tokenExpiresAt, new Date()),
            ...(sudo ? [gte(UserSession.sudoExpiresAt, new Date())] : []),
        ))
        .limit(1);

    if (sessionToken) {
        const sessionInfo = extractUserInfoHeader(request);
        const newLastUse = {
            date: new Date().toISOString(),
            ip: sessionInfo.ip,
            ua: sessionInfo.ua,
            location: sessionInfo.location,
        }
        // Fire and forget the update
        setSessionTokenLastUse(sessionToken.id, newLastUse, sessionToken.tokenExpiresAt)
            .then(() => { })
            .catch((err) => {
                // Silently handle any errors since this is non-critical
                console.error("Failed to update session:", err);
            });

        return sessionToken.userId;
    }

    return null;
};

export const extractUserInfoHeader = (request: Request) => {
    // get IP, User-Agent, and location (note, using cloudflare proxy)
    // location should be detailed as possible (city, region, country)
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const ua = request.headers.get("user-agent") || "unknown";
    const city = request.headers.get("cf-ipcity") || "unknown";
    const region = request.headers.get("cf-region") || "unknown";
    const country = request.headers.get("cf-ipcountry") || "unknown";

    return {
        ip,
        ua,
        location: `${city}, ${region}, ${country}`,
    };
};
