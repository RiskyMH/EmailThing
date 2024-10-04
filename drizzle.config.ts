import type { Config } from "drizzle-kit";

export default {
    schema: "./app/db/schema.ts",
    out: "./drizzle",
    driver: 'turso',
    dialect: 'sqlite',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
        authToken: process.env.DATABASE_TOKEN!
    },
    verbose: true,
    // } satisfies Config;
} as Config;