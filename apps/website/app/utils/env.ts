import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
    server: {
        DATABASE_URL: z.string().min(1),
        EMAIL_AUTH_TOKEN: z.string().min(1),
        JWT_TOKEN: z.string().optional(),
    },
    client: {
        NEXT_PUBLIC_APP_URL: z.string().min(1),
    },
    runtimeEnv: {
        DATABASE_URL: process.env.DATABASE_URL,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        EMAIL_AUTH_TOKEN: process.env.EMAIL_AUTH_TOKEN,
        JWT_TOKEN: process.env.JWT_TOKEN,
    },
})
