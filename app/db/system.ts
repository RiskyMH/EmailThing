import { sqliteTable, int, integer, index, text } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { nocaseText } from './custom-drizzle';

// Default Domains
export const DefaultDomain = sqliteTable("default_domains", {
    id: text("id", { length: 24 }).primaryKey().unique().$defaultFn(() => createId()),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    domain: nocaseText("domain").notNull().unique(),
    authKey: text("auth_key", { length: 24 }).notNull().$defaultFn(() => createId()),
    available: int("available", { mode: "boolean" }).default(false),
}, (table) => {
    return {
        availableIdx: index("default_domain_available").on(table.available),
        idx: index("default_domains_idx").on(table.domain, table.authKey)
    }
});
