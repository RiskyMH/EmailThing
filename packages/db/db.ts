import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleBun } from 'drizzle-orm/bun-sql';
import * as schema from "./schema";
import { sql } from 'drizzle-orm';

const _db = process.versions.bun
    ? drizzleNode(process.env.DATABASE_URL as string, { schema, logger: false })
    : drizzleNode(process.env.DATABASE_URL as string, { schema, logger: false });

import type { BatchItem, BatchResponse } from "drizzle-orm/batch"

async function batch<U extends BatchItem<'pg'>, T extends Readonly<[U, ...U[]]>>(
    queries: T,
): Promise<BatchResponse<T>> {
    const results: any[] = [];
    await db.transaction(async (tx) => {
        // test it works
        for (const query of queries) {
            console.log(query);
            // tx.setTransaction
            const res = await tx.execute(query);
            console.log(res);
            if (query.mode === "first") {
                results.push(res.rows[0]);
            } else {
                results.push(res.rows);
            }
        }
    });
    return results;
}

async function batchFetch<U extends BatchItem<'pg'>, T extends Readonly<[U, ...U[]]>>(
    queries: T,
): Promise<BatchResponse<T>> {
    return Promise.all(queries)
}

const db = _db as typeof _db & { batch: typeof batch, batchFetch: typeof batchFetch };
db.batch = batch;
db.batchFetch = batchFetch;

export default db;
export { schema, db };
export * from "./schema";
