import { env } from "./env";

const redis = new Bun.RedisClient(env.REDIS_URL);
const REDIS_PREFIX = "emailthing:";

export { redis, REDIS_PREFIX };
