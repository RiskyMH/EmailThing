import { REDIS_PREFIX, redis } from "./redis";

/**
 * Atomic, robust, generic fixed-window rate limiter using Redis.
 *
 * @param opts.key - The unique subject key (IP, userId, etc, include a prefix/category if needed!)
 * @param opts.windowSeconds - Window size in seconds (e.g. 60 = 1 minute)
 * @param opts.maxInWindow - Max allowed hits in window
 * @param [opts.namespace] - Optional Redis key namespace (default: "rl:")
 * @returns Promise<{ allowed, retryAfter, remaining, current, resetAt }>
 *
 * Usage:
 *   await rateLimitCheck({ key: "123.45.67.89", namespace: "ip", windowSeconds: 60, maxInWindow: 10 })
 */
export async function rateLimitCheck({
    key, windowSeconds, maxInWindow, namespace = "rl"
}: {
    key: string;
    windowSeconds: number;
    maxInWindow: number;
    namespace?: string;
}): Promise<{
    allowed: boolean;
    retryAfter: number; // ms til allowed again (if denied), 0 if allowed
    remaining: number; // hits until banned for window
    current: number; // current value in window
    resetAt: number; // timestamp (ms) when count resets
}> {
    const redisKey = `${REDIS_PREFIX}${namespace}:${key}`;
    const now = Math.floor(Date.now() / 1000);

    let val: number;
    let ttl: number;
    try {
        val = await redis.incr(redisKey);
        ttl = await redis.ttl(redisKey);

        // if no ttl set, set it
        // (-1 if no expiry, or -2 if key doesn't exist)
        if (ttl === -1 || ttl === -2) {
            await redis.expire(redisKey, windowSeconds);
            ttl = windowSeconds;
        }
    } catch (err) {
        // Defensive fallback: if Redis error, allow by default but log/warn
        console.error("Rate limiting Redis error", err);
        return { allowed: true, retryAfter: 0, remaining: maxInWindow, current: 0, resetAt: now * 1000 + windowSeconds * 1000 };
    }

    const allowed = val <= maxInWindow;
    const remaining = Math.max(0, maxInWindow - val);
    const retryAfter = allowed ? 0 : ttl * 1000;
    const resetAt = (now + ttl) * 1000;

    return { allowed, retryAfter, remaining, current: val, resetAt };
}
function rateLimitIncrement({ key, namespace = "rl", incBy = 1 }: { key: string; namespace?: string; incBy?: number }) {
    const redisKey = `${REDIS_PREFIX}${namespace}:${key}`;
    return redis.incrby(redisKey, incBy);
}

function combineChecks(...checks: Awaited<ReturnType<typeof rateLimitCheck>>[]) {
    const allowed = checks.every(c => c.allowed);
    const retryAfter = Math.max(...checks.map(c => c.retryAfter));
    const remaining = Math.min(...checks.map(c => c.remaining));
    const current = Math.max(...checks.map(c => c.current));
    const resetAt = Math.max(...checks.map(c => c.resetAt));
    return { allowed, retryAfter, remaining, current, resetAt };
}

// Login rate limiters
export async function authRatelimit(ip: string, username?: string) {
    const windowSeconds = 90;
    const maxAttemptsIp = 20;
    const maxAttemptsUser = 10;

    const [ipCheck, ipCheck2, userCheck] = await Promise.all([
        rateLimitCheck({ key: ip, namespace: "auth:ip", windowSeconds, maxInWindow: maxAttemptsIp }),
        rateLimitCheck({ key: ip, namespace: "auth:ip2", windowSeconds: windowSeconds * 20, maxInWindow: maxAttemptsIp * 2 }),
        username ? rateLimitCheck({ key: username, namespace: "auth:user", windowSeconds, maxInWindow: maxAttemptsUser }) : null,
    ]);

    if (userCheck) return combineChecks(ipCheck, ipCheck2, userCheck);
    return combineChecks(ipCheck, ipCheck2);

}
export async function authRatelimitLogFailed(ip: string, username?: string) {
    const incBy = 1;
    await Promise.all([
        rateLimitIncrement({ key: ip, namespace: "auth:ip", incBy }),
        rateLimitIncrement({ key: ip, namespace: "auth:ip2", incBy }),
        username ? rateLimitIncrement({ key: username, namespace: "auth:user", incBy }) : null,
    ]);
}
export async function authRatelimitSucceeded(ip: string, username?: string) {
    const incBy = -1;
    await Promise.all([
        rateLimitIncrement({ key: ip, namespace: "auth:ip", incBy }),
        rateLimitIncrement({ key: ip, namespace: "auth:ip2", incBy }),
        username ? rateLimitIncrement({ key: username, namespace: "auth:user", incBy }) : null,
    ]);
}

// Register rate limiter
export async function registerRatelimit(ip: string) {
    const windowSeconds = 60;
    const maxAttemptsIp = 10;

    return rateLimitCheck({ key: ip, namespace: "register:ip", windowSeconds, maxInWindow: maxAttemptsIp });
}
export async function registerCreateRatelimit(ip: string) {
    // Separate limiter for account creation step, to prevent abuse while allowing some leniency in initial validation steps
    const windowSeconds = 60 * 60; // 1 hour
    const maxAttemptsIp = 10;

    const windowSeconds2 = 60 * 60 * 24; // one day
    const maxAttemptsIp2 = 50;

    return combineChecks(...await Promise.all([
        rateLimitCheck({ key: ip, namespace: "register:ip", windowSeconds, maxInWindow: maxAttemptsIp }),
        rateLimitCheck({ key: ip, namespace: "register:ip2", windowSeconds: windowSeconds2, maxInWindow: maxAttemptsIp2 }),
    ]));
}
export async function registerRatelimitLogFailed(ip: string) {
    const incBy = 1;
    await rateLimitIncrement({ key: ip, namespace: "register:ip", incBy });
}

// Reset password rate limiters
export async function resetPasswordRatelimitRequest(ip: string, username: string) {
    const windowSeconds = 5 * 60; // 5 minutes
    const maxAttemptsIp = 3;
    const maxAttemptsUser = 3;

    const windowSeconds2 = 24 * 60 * 60; // 24 hours
    const maxAttemptsIp2 = 15;
    const maxAttemptsUser2 = 10;

    const [ipCheck, userCheck] = await Promise.all([
        rateLimitCheck({ key: ip, namespace: "reset:ip", windowSeconds, maxInWindow: maxAttemptsIp }),
        rateLimitCheck({ key: username, namespace: "reset:user", windowSeconds, maxInWindow: maxAttemptsUser }),

        rateLimitCheck({ key: ip, namespace: "reset:ip2", windowSeconds: windowSeconds2, maxInWindow: maxAttemptsIp2 }),
        rateLimitCheck({ key: username, namespace: "reset:user2", windowSeconds: windowSeconds2, maxInWindow: maxAttemptsUser2 }),
    ]);
    return combineChecks(ipCheck, userCheck);
}
export async function logResetPasswordRequestFailed(ip: string, username?: string) {
    const incBy = 1;
    await Promise.all([
        rateLimitIncrement({ key: ip, namespace: "reset:ip", incBy }),
        rateLimitIncrement({ key: ip, namespace: "reset:ip2", incBy }),
        username ? rateLimitIncrement({ key: username, namespace: "reset:user", incBy }) : null,
        username ? rateLimitIncrement({ key: username, namespace: "reset:user2", incBy }) : null,
    ]);
}

export async function resetPasswordRatelimitChange(ip: string) {
    const windowSeconds = 5 * 60; // 5 minutes
    const maxAttemptsIp = 3;

    return rateLimitCheck({ key: ip, namespace: "reset-change:ip", windowSeconds, maxInWindow: maxAttemptsIp });
}
export async function logResetPasswordChangeFailed(ip: string) {
    const incBy = 1;
    await rateLimitIncrement({ key: ip, namespace: "reset-change:ip", incBy });
}

// email sending rate limiter
export async function emailSendRatelimit(mailboxId: string) {
    const windowSeconds = 20 * 60; // 20 minutes
    const maxEmails = 15;

    const windowSeconds2 = 60 * 60 * 24; // 1 day
    const maxEmails2 = 100;

    return combineChecks(...await Promise.all([
        rateLimitCheck({ key: mailboxId, namespace: "email-send:mailbox", windowSeconds, maxInWindow: maxEmails }),
        rateLimitCheck({ key: mailboxId, namespace: "email-send:mailbox2", windowSeconds: windowSeconds2, maxInWindow: maxEmails2 }),
    ]));
}

// emailthing.me ratelimiter
export async function emailMeRatelimit(username: string) {
    const windowSeconds = 60; // 1 minute
    const maxEmails = 5;
    return rateLimitCheck({ key: username, namespace: "emailthing-me:username", windowSeconds, maxInWindow: maxEmails });
}

// backup email sending rate limiter
export async function backupEmailSendRatelimit(userId: string) {
    const windowSeconds = 60; // 1 minute
    const maxEmails = 3;

    const windowSeconds2 = 60 * 60; // 1 hour
    const maxEmails2 = 10;

    return combineChecks(
        await rateLimitCheck({ key: userId, namespace: "backup-email-send:user", windowSeconds, maxInWindow: maxEmails }),
        await rateLimitCheck({ key: userId, namespace: "backup-email-send:user2", windowSeconds: windowSeconds2, maxInWindow: maxEmails2 }),
    );
}
