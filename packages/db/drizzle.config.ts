import type { Config } from "drizzle-kit";

export default {
    schema: "./packages/db/schema.ts",
    out: "./drizzle",
    // driver: 'turso',
    dialect: "turso",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
        authToken: process.env.DATABASE_TOKEN!,
    },
    verbose: true,
    // } satisfies Config;
} as Config;
