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
    const results: BatchResponse<T> = [] as BatchResponse<T>;
    await db.transaction(async (tx) => {
        for (const query of queries) {
            // @ts-ignore
            const res = await tx.execute(query);
            // @ts-ignore
            if (query.mode === "first") {
                // @ts-ignore
                results.push(res.rows[0]);
            } else {
                // @ts-ignore
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
