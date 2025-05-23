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

            // if its a builded query, we need to map the columns to the JS names (from db ones)
            // @ts-ignore
            if (query.table) {
                // @ts-ignore
                const table = Object.keys(query.table).reduce((acc, k) => {
                    // @ts-ignore
                    acc[query.table[k].name] = k;
                    return acc;
                }, {} as Record<string, any>);
                
                for (const row of res.rows) {
                    for (const [column, value] of Object.entries(row)) {
                        const maybe = table[column];
                        if (maybe) {
                            row[maybe] = value;
                            delete row[column];
                        }
                    }
                }
            }
            
            // if its a build query with findFirst, we need to return the first row
            // @ts-ignore
            results.push(query.mode === "first" ? res.rows[0] : res.rows);
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
