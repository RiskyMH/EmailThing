// Improved Redis session management utility
// Rewritten per prompt and comments, robust and ready for direct use
import { TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } from "@emailthing/const/expiry";
import { REDIS_PREFIX, redis } from "./redis";

/**
 * Types
 */
export type RedisUserSession = {
    id: string;
    userId: string;
    createdAt: string;
    lastUsed: { date: string; ip: string; ua: string; location: string };
    token: string;
    refreshToken: string;
    tokenExpiresAt: string;
    refreshTokenExpiresAt: string;
    sudoExpiresAt?: string;
    method: "password" | "passkey";
};

/**
 * Redis keys and helpers
 */
const SESSION_PREFIX = `${REDIS_PREFIX}session:`;               // session:<sessionId>
const SESSION_USER_SET_PREFIX = `${REDIS_PREFIX}session:user:`; // session:user:<userId>
const SESSION_TOKEN_PREFIX = `${REDIS_PREFIX}session:token:`;   // session:token:<token>
const SESSION_REFRESH_TOKEN_PREFIX = `${REDIS_PREFIX}session:refresh-token:`; // session:refresh-token:<token>

/**
 * Store a new session in Redis
 * Adds: session:<sessionId> (full), session:user:<userId> (set), session:token:<token>, session:refresh-token:<refreshToken>
 */
export async function storeSession({
    session: _session, token, refreshToken
}: { session: Omit<RedisUserSession, "tokenExpiresAt" | "refreshTokenExpiresAt" | "createdAt" | "token" | "refreshToken">, token: string, refreshToken: string }) {
    const session: RedisUserSession = {
        ..._session,
        createdAt: new Date().toISOString(),
        token,
        refreshToken,
        tokenExpiresAt: new Date(Date.now() + TOKEN_EXPIRES_IN).toISOString(),
        refreshTokenExpiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN).toISOString(),
    };
    // Session data JSON
    const sessionKey = SESSION_PREFIX + session.id;
    const sessionJson = JSON.stringify(session);

    await Promise.all([
        redis.set(sessionKey, sessionJson, "PX", REFRESH_TOKEN_EXPIRES_IN), // session object
        redis.sadd(SESSION_USER_SET_PREFIX + session.userId, session.id), // add to user's set
        redis.set(SESSION_TOKEN_PREFIX + token, session.id, "PX", TOKEN_EXPIRES_IN),  // access token pointer
        redis.set(SESSION_REFRESH_TOKEN_PREFIX + refreshToken, session.id, "PX", REFRESH_TOKEN_EXPIRES_IN) // refresh token pointer
    ]);
    // Renew/set expiry for session:user:<userId> to match refresh token TTL
    await redis.pexpire(SESSION_USER_SET_PREFIX + session.userId, REFRESH_TOKEN_EXPIRES_IN);
    return session;
}

/**
 * Get sessionId by token or refresh token (returns null if not found/expired)
 */
export async function getSessionIdByToken(token: string): Promise<string | null> {
    return redis.get(SESSION_TOKEN_PREFIX + token);
}
export async function getSessionIdByRefreshToken(token: string): Promise<string | null> {
    return redis.get(SESSION_REFRESH_TOKEN_PREFIX + token);
}

/**
 * Get full session by sessionId
 */
export async function getSession(sessionId: string): Promise<RedisUserSession | null> {
    const raw = await redis.get(SESSION_PREFIX + sessionId);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}
export async function getSessionByToken(token: string): Promise<RedisUserSession | null> {
    const sessionId = await getSessionIdByToken(token);
    if (!sessionId) return null;
    return getSession(sessionId);
}
export const getSessionByRefreshToken = async (token: string): Promise<RedisUserSession | null> => {
    const sessionId = await getSessionIdByRefreshToken(token);
    if (!sessionId) return null;
    return getSession(sessionId);
}

/**
 * Get all sessions for a given user (automatically cleans up missing/deleted ones)
 */
export async function getSessionsByUserId(userId: string): Promise<RedisUserSession[]> {
    const setKey = SESSION_USER_SET_PREFIX + userId;
    const sessionIds = await redis.smembers(setKey);
    if (!sessionIds?.length) return [];
    const sessionKeys = sessionIds.map(id => SESSION_PREFIX + id);
    const sessionsRaw = await redis.mget(...sessionKeys);
    const sessions: RedisUserSession[] = [];
    // Clean up any missing/gone sessions from the set
    await Promise.all(sessionIds.map(async (id, i) => {
        const raw = sessionsRaw[i];
        if (raw) {
            try { sessions.push(JSON.parse(raw)); } catch { }
        } else {
            await redis.srem(setKey, id); // cleanup
        }
    }));
    return sessions;
}

/**
 * Set last-used info for a session (fire-and-forget)
 */
export async function updateSessionLastUsed(sessionId: string, lastUsed: Omit<RedisUserSession["lastUsed"], "date">) {
    const key = SESSION_PREFIX + sessionId;
    const raw = await redis.get(key);
    if (!raw) return;
    let session: RedisUserSession;
    try {
        session = JSON.parse(raw);
    } catch { return; }
    session.lastUsed = {
        ...lastUsed,
        date: new Date().toISOString(),
    };

    await redis.set(key, JSON.stringify(session), "KEEPTTL");
    return true;
}

/**
 *  Renew session tokens (used for refresh token flow)
 *  Updates session with new tokens and expiry, keeps same sessionId and userId
 *  Returns updated session object
 * 
 *  Note: this does not change expiry of the session itself (which is tied to refresh token)
 */
export async function renewSessionTokens(
    sessionId: string,
    newToken: string,
    newRefreshToken: string,
    lastUsed: Omit<RedisUserSession["lastUsed"], "date">
): Promise<RedisUserSession> {
    const raw = await redis.get(SESSION_PREFIX + sessionId);
    if (!raw) throw new Error("Session not found");
    let session: RedisUserSession;
    try { session = JSON.parse(raw); } catch { throw new Error("Corrupt session"); }

    const oldToken = session.token;
    const oldRefreshToken = session.refreshToken;

    session = {
        ...session,
        token: newToken,
        refreshToken: newRefreshToken,
        tokenExpiresAt: new Date(Date.now() + TOKEN_EXPIRES_IN).toISOString(),
        refreshTokenExpiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN).toISOString(),
        lastUsed: {
            ...lastUsed,
            date: new Date().toISOString(),
        },
    };

    // Persist session (but don't change session ttl)
    const existingRefreshTokenTtl = await redis.pttl(SESSION_REFRESH_TOKEN_PREFIX + oldRefreshToken);
    await Promise.all([
        redis.set(SESSION_PREFIX + sessionId, JSON.stringify(session), "KEEPTTL"),
        redis.set(SESSION_TOKEN_PREFIX + newToken, sessionId, "PX", TOKEN_EXPIRES_IN),
        redis.set(SESSION_REFRESH_TOKEN_PREFIX + newRefreshToken, sessionId, "PX", existingRefreshTokenTtl),
        redis.del(SESSION_TOKEN_PREFIX + oldToken),
        redis.del(SESSION_REFRESH_TOKEN_PREFIX + oldRefreshToken),
    ]);
    return session;
}

/**
 * Delete session fully by id (removes from all redis records)
 */
export async function deleteSessionById(sessionId: string) {
    const sess = await getSession(sessionId);
    if (!sess) return;

    await Promise.all([
        redis.del(
            SESSION_PREFIX + sessionId,
            SESSION_TOKEN_PREFIX + sess.token,
            SESSION_REFRESH_TOKEN_PREFIX + sess.refreshToken
        ),
        redis.srem(SESSION_USER_SET_PREFIX + sess.userId, sessionId)
    ]);
    }

/**
 * Delete session by token (removes session and token pointer)
 */
export async function deleteSessionByToken(token: string) {
    const sessionId = await getSessionIdByToken(token);
    if (!sessionId) return;
    await Promise.all([
        redis.del(SESSION_TOKEN_PREFIX + token),
        deleteSessionById(sessionId)
    ]);
}

/**
 * Delete session by refresh token (removes session and refresh token pointer)
 */
export async function deleteSessionByRefreshToken(token: string) {
    const sessionId = await getSessionIdByRefreshToken(token);
    if (!sessionId) return;
    await Promise.all([
        redis.del(SESSION_REFRESH_TOKEN_PREFIX + token),
        deleteSessionById(sessionId)
    ]);
}

// Optional: Utility to clean all sessions for a user (logout everywhere)
export async function deleteAllSessionsForUser(userId: string) {
    const sessionIds = await redis.smembers(SESSION_USER_SET_PREFIX + userId);
    if (!sessionIds?.length) return;
    await Promise.all([
        ...sessionIds.map(id => deleteSessionById(id)),
        redis.del(SESSION_USER_SET_PREFIX + userId)
    ]);
}

