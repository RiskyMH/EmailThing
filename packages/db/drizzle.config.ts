import type { Config } from "drizzle-kit";

export default {
    schema: "./schema.ts",
    out: "./drizzle",
    // driver: 'turso',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!
    },
    verbose: true,
} satisfies Config;