import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
    server: {
        DATABASE_URL: z.string().min(1),
        EMAIL_AUTH_TOKEN: z.string().min(1),
        EMAIL_DKIM_PRIVATE_KEY: z.string().optional(),
        JWT_TOKEN: z.string().optional(),
        WEB_NOTIFICATIONS_PRIVATE_KEY: z.string().min(1),
    },
    client: {
        NEXT_PUBLIC_APP_URL: z.string().min(1),
        NEXT_PUBLIC_NOTIFICATIONS_PUBLIC_KEY: z.string().min(1),
    },
    runtimeEnv: {
        DATABASE_URL: process.env.DATABASE_URL,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_NOTIFICATIONS_PUBLIC_KEY: process.env.NEXT_PUBLIC_NOTIFICATIONS_PUBLIC_KEY,
        WEB_NOTIFICATIONS_PRIVATE_KEY: process.env.WEB_NOTIFICATIONS_PRIVATE_KEY,
        EMAIL_AUTH_TOKEN: process.env.EMAIL_AUTH_TOKEN,
        EMAIL_DKIM_PRIVATE_KEY: process.env.EMAIL_DKIM_PRIVATE_KEY,
        JWT_TOKEN: process.env.JWT_TOKEN,
    },
})
