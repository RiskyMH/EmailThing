import { getSessionByToken, updateSessionLastUsed } from "@/utils/redis-session";

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

    const session = await getSessionByToken(token);

    if (session) {
        const sessionInfo = extractUserInfoHeader(request);
        // Fire and forget the update
        updateSessionLastUsed(token, sessionInfo)
            .then(() => { })
            .catch((err) => {
                // Silently handle any errors since this is non-critical
                console.error("Failed to update session:", err);
            });

        return session.userId;
    }

    return null;
};

export const extractUserInfoHeader = (request: Request) => {
    // get IP, User-Agent, and location (note, using cloudflare proxy)
    // location should be detailed as possible (city, region, country)
    const ip = request.headers.get("x-forwarded-for") || "unknown";
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
