import { env } from "@/utils/env";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// create the connection
const client = createClient({
    url: env.DATABASE_URL,
    authToken: env.DATABASE_TOKEN,
});
const db = drizzle(client, { schema, logger: false });

export default db;
export { schema, db, client };
export * from "./schema";
