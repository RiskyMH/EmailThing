import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "./schema";

const db = drizzle(process.env.DATABASE_URL as string, { schema, logger: false }) ;


import type { BatchItem } from "drizzle-orm/batch"

async function batch<U extends BatchItem<'pg'>, T extends Readonly<[U, ...U[]]>>(
    queries: T,
) {
    let i = 0;
    return db.transaction(async (tx) => {
        for (const query of queries) {
            console.log(i++);
            await query;
        }
    });
}

db.batch = batch;

export default db;
export { schema, db };
export * from "./schema";
