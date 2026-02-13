import { env } from "./env";

const getRedis = () => new Bun.RedisClient(env.REDIS_URL);
declare global { var _redis: ReturnType<typeof getRedis> | undefined }
const redis = process.env.NODE_ENV === "production" ? getRedis() : (globalThis._redis ||= getRedis());

const REDIS_PREFIX = "emailthing:";

export { redis, REDIS_PREFIX };
