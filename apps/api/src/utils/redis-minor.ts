import { REDIS_PREFIX, redis } from "./redis";
import { RESET_PASSWORD_TOKEN_EXPIRES_IN } from "@emailthing/const/expiry";

// reset password token
const RESET_PASSWORD_PREFIX = `${REDIS_PREFIX}reset-password:`; // reset-password:<token>
const RESET_PASSWORD_TOKENS_PREFIX = `${RESET_PASSWORD_PREFIX}tokens:`; // reset-password:tokens:<userId>
export async function setResetPasswordToken(userId: string, token: string) {
    await redis.setex(`${RESET_PASSWORD_PREFIX}${token}`, RESET_PASSWORD_TOKEN_EXPIRES_IN / 1000, userId);
    await redis.sadd(`${RESET_PASSWORD_TOKENS_PREFIX}${userId}`, token);
    await redis.expire(`${RESET_PASSWORD_TOKENS_PREFIX}${userId}`, RESET_PASSWORD_TOKEN_EXPIRES_IN / 1000);
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
