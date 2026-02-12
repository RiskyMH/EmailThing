import { REDIS_PREFIX, redis } from "./redis";
import { REFRESH_TOKEN_EXPIRES_IN, RESET_PASSWORD_TOKEN_EXPIRES_IN } from "@emailthing/const/expiry";

// reset password token
const RESET_PASSWORD_PREFIX = `${REDIS_PREFIX}reset-password:`; // reset-password:<token>
const RESET_PASSWORD_TOKENS_PREFIX = `${RESET_PASSWORD_PREFIX}tokens:`; // reset-password:tokens:<userId>
export async function setResetPasswordToken(userId: string, token: string) {
    await redis.set(`${RESET_PASSWORD_PREFIX}${token}`, userId, "PX", RESET_PASSWORD_TOKEN_EXPIRES_IN);
    await redis.sadd(`${RESET_PASSWORD_TOKENS_PREFIX}${userId}`, token);
    await redis.pexpire(`${RESET_PASSWORD_TOKENS_PREFIX}${userId}`, RESET_PASSWORD_TOKEN_EXPIRES_IN);
}
export const getResetPasswordToken = async (token: string) => {
    return redis.get(`${RESET_PASSWORD_PREFIX}${token}`);
}
export const invalidateResetPasswordToken = async (token: string) => {
    const userId = await getResetPasswordToken(token);
    if (userId) {
        await redis.del(`${RESET_PASSWORD_PREFIX}${token}`);
        await redis.srem(`${RESET_PASSWORD_TOKENS_PREFIX}${userId}`, token);
    }
}
export const invalidateAllResetPasswordTokensForUser = async (userId: string) => {
    const tokens = await redis.smembers(`${RESET_PASSWORD_TOKENS_PREFIX}${userId}`);
    if (tokens.length > 0) {
        const delKeys = tokens.map(token => `${RESET_PASSWORD_PREFIX}${token}`);
        await redis.del(...delKeys, `${RESET_PASSWORD_TOKENS_PREFIX}${userId}`);
    }
}

// refresh token last used tracking
export interface SessionTokenLastUse {
    date: string;
    ip: string;
    ua: string;
    location: string;
}
export const setSessionTokenLastUse = async (id: string, data: SessionTokenLastUse, expire?: Date) => {
    if (expire) {
        await redis.set(`${REDIS_PREFIX}session-token-last-used:${id}`, JSON.stringify(data), "PXAT", expire.getTime());
    } else {
        // assume default expiry of refresh token expiry then
        await redis.set(`${REDIS_PREFIX}session-token-last-used:${id}`, JSON.stringify(data), "PX", REFRESH_TOKEN_EXPIRES_IN);
    }
}
export const getSessionTokenLastUse = async (id: string): Promise<SessionTokenLastUse | null> => {
    const data = await redis.get(`${REDIS_PREFIX}session-token-last-used:${id}`);
    if (!data) return null;
    try {
        return JSON.parse(data);
    } catch (e) {
        return null;
    }
}
export const deleteSessionTokenLastUse = async (id: string) => {
    await redis.del(`${REDIS_PREFIX}session-token-last-used:${id}`);
}