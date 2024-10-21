import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import { env } from "./env";

const JWTToken = new TextEncoder().encode(env.JWT_TOKEN);

export const getUserByToken = cache(async (token: string): Promise<string | null> => {
    const jwt = await jwtVerify(token, JWTToken, { algorithms: ["HS256"] });
    const userId = jwt.payload.sub;

    if (!userId) return null;

    return userId;
});

export const createUserToken = (user: { id: string }) => {
    return new SignJWT({ hello: "world" })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setNotBefore(Date.now() / 1000 - 60_000)
        .setExpirationTime("30d")
        .setSubject(user.id.toString())
        .sign(JWTToken);
};

export const addUserTokenToCookie = async (user: { id: string }) => {
    const token = await createUserToken(user);
    (await cookies()).set("token", token, {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        path: "/",
        sameSite: "lax",
        httpOnly: true,
        secure: true,
    });
};

export const getCurrentUser = async () => {
    const token = (await cookies()).get("token");
    if (!token?.value) return null;
    try {
        return await getUserByToken(token.value);
    } catch (e) {
        return null;
    }
};

export const removeToken = async () => (await cookies()).delete("token");
