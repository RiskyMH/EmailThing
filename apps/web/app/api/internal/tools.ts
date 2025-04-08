export const allowedOrigins = [
    "https://emailthing.app",
    "https://pwa.emailthing.app",
    "https://*.emailthing.app",
    "http://localhost:3000",
    "http://localhost:1234",
    "https://emailthing.pages.dev",
    "https://*.emailthing.pages.dev",
]


export const isValidOrigin = (origin: string) => {
    if (origin.endsWith(".emailthing.pages.dev") || origin.endsWith(".emailthing.app")) {
        return true
    }
    return allowedOrigins.includes(origin)
}

import { cookies, headers } from "next/headers";
import { getUserByToken } from "@/utils/jwt";

export const getCurrentUser = async () => {
    const token = (await cookies()).get("token")?.value || (await headers()).get("authorization");
    if (!token) return null;
    try {
        return await getUserByToken(token);
    } catch (e) {
        return null;
    }
};