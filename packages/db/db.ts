import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
// import { drizzle as drizzleBun } from "drizzle-orm/bun-sql";
import type { BatchItem, BatchResponse } from "drizzle-orm/batch";
import { relations } from "./relations";

const _db = process.isBun
    ? drizzleNode(process.env.DATABASE_URL as string, { relations, logger: false })
    : drizzleNode(process.env.DATABASE_URL as string, { relations, logger: false });


// SOME POLLYFILL FUNCTIONS TO MAKE SQLITE -> POSTGRES EASIER
async function batchUpdate<U extends BatchItem<"pg">, T extends Readonly<[U, ...U[]]>>(queries: T): Promise<void> {
    await db.transaction(async (tx) => {
        for (const query of queries) {
            // @ts-ignore
            await tx.execute(query);
        }
    });
}
// SOME POLLYFILL FUNCTIONS TO MAKE SQLITE -> POSTGRES EASIER
async function batchFetch<U extends BatchItem<"pg">, T extends Readonly<[U, ...U[]]>>(
    queries: T,
): Promise<BatchResponse<T>> {
    // @ts-ignore
    // return Promise.all(queries)
    const results: BatchResponse<T> = [] as BatchResponse<T>;
    for (const query of queries) {
        // @ts-ignore
        results.push(await query);
    }
    return results;
}
// SOME POLLYFILL FUNCTIONS TO MAKE SQLITE -> POSTGRES EASIER
const db = _db as typeof _db & { batchUpdate: typeof batchUpdate; batchFetch: typeof batchFetch };
db.batchUpdate = batchUpdate;
db.batchFetch = batchFetch;

export default db;
export * from "./schema";
export * as schema from "./schema";
export { relations, db };
