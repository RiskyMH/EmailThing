import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleBun } from 'drizzle-orm/bun-sql';
import * as schema from "./schema";
import { sql } from 'drizzle-orm';

const _db = process.versions.bun
    ? drizzleNode(process.env.DATABASE_URL as string, { schema, logger: false })
    : drizzleNode(process.env.DATABASE_URL as string, { schema, logger: false });

import type { BatchItem, BatchResponse } from "drizzle-orm/batch"

let a = 1

async function batchUpdate<U extends BatchItem<'pg'>, T extends Readonly<[U, ...U[]]>>(
    queries: T,
): Promise<void> {
    await db.transaction(async (tx) => {
        for (const query of queries) {
            // @ts-ignore
            await tx.execute(query);
        }
    });
}

async function batchFetch<U extends BatchItem<'pg'>, T extends Readonly<[U, ...U[]]>>(
    queries: T,
): Promise<BatchResponse<T>> {
    const results: BatchResponse<T> = [] as BatchResponse<T>;
        for (const query of queries) {
            // @ts-ignore
            results.push(await query);
        }
    return results;
}

const db = _db as typeof _db & { batchUpdate: typeof batchUpdate, batchFetch: typeof batchFetch };
db.batchUpdate = batchUpdate;
db.batchFetch = batchFetch;

export default db;
export { schema, db };
export * from "./schema";
