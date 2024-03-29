import type { Config } from "drizzle-kit";

export default {
    schema: "./app/db/schema.ts",
    out: "./drizzle",
    driver: 'turso',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
        authToken: process.env.DATABASE_TOKEN!
    }
} satisfies Config;