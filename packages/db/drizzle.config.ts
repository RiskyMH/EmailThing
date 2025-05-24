import type { Config } from "drizzle-kit";
import path from "node:path";

export default {
    schema: path.join(__dirname, "./schema.ts"),
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
    verbose: true,
} satisfies Config;
