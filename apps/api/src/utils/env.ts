import * as z from "zod/mini";

const envSchema = z.object({
    DATABASE_URL: z.string(),
    REDIS_URL: z.string(),
    EMAIL_AUTH_TOKEN: z.string().check(z.minLength(1)),
    EMAIL_DKIM_PRIVATE_KEY: z.optional(z.string()),
    WEB_NOTIFICATIONS_PRIVATE_KEY: z.string().check(z.minLength(1)),
    S3_KEY_ID: z.string(),
    S3_SECRET_ACCESS_KEY: z.string(),
    S3_URL: z.string(),
    S3_BUCKET: z.string(),
    NEXT_PUBLIC_NOTIFICATIONS_PUBLIC_KEY: z.string().check(z.minLength(1)),
});

const _env = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    EMAIL_AUTH_TOKEN: process.env.EMAIL_AUTH_TOKEN,
    EMAIL_DKIM_PRIVATE_KEY: process.env.EMAIL_DKIM_PRIVATE_KEY?.replaceAll(/(\r\n|\r|\n)/g, "\r\n"),
    WEB_NOTIFICATIONS_PRIVATE_KEY: process.env.WEB_NOTIFICATIONS_PRIVATE_KEY,
    S3_KEY_ID: process.env.S3_KEY_ID,
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    S3_URL: process.env.S3_URL,
    S3_BUCKET: process.env.S3_BUCKET || "email",
    NEXT_PUBLIC_NOTIFICATIONS_PUBLIC_KEY: process.env.NEXT_PUBLIC_NOTIFICATIONS_PUBLIC_KEY,
});

if (!_env.success) {
    console.error("❌ Invalid environment variables:");
    for (const issue of _env.error.issues) {
        const boldAnsi = Bun.enableANSIColors ? "\x1b[1m" : "";
        const resetAnsi = Bun.enableANSIColors ? "\x1b[0m" : "";
        const redAnsi = Bun.enableANSIColors ? "\x1b[31m" : "";
        console.error(`${redAnsi}  - process.env.${boldAnsi}${issue.path.join(".")}${resetAnsi}: ${redAnsi}${issue.message}${resetAnsi}`);
    }
    console.error()
    throw new Error("Invalid environment variables");
}

export const env = _env.data;

export type Env = z.infer<typeof envSchema>;
