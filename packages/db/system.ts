import { createId } from "@paralleldrive/cuid2";
import { index, integer, primaryKey, pgTable, text, varchar, timestamp, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { nocaseText } from "./custom-drizzle";
import { sql } from "drizzle-orm";

// Default Domains
export const DefaultDomain = pgTable(
    "default_domains",
    {
        id: varchar("id", { length: 25 })
            .primaryKey()
            .unique()
            .$defaultFn(() => createId()),
        createdAt: timestamp("created_at")
            .notNull()
            .defaultNow(),
        updatedAt: timestamp("updated_at")
            .notNull()
            .defaultNow()
            .$onUpdateFn(() => new Date()),
        domain: nocaseText("domain").notNull().unique(),
        authKey: varchar("auth_key", { length: 250 })
            .notNull()
            .$defaultFn(() => createId()),
        available: boolean("available").default(false),
        tempDomain: boolean("temp_domain").default(false),

        // anonymous data - but here for syncing
        isDeleted: boolean("is_deleted").default(false),
    },
    (table) => {
        return {
            availableIdx: index("default_domain_available").on(table.available),
            idx: index("default_domains_idx").on(table.domain, table.authKey),
            domainLower: index("default_domains_domain_lower_idx").on(sql`lower(${table.domain})`),
            uniqueDomain: uniqueIndex("default_domains_domain_unique_").on(sql`lower(${table.domain})`),
        };
    },
);

// Stats
export const Stats = pgTable(
    "stats",
    {
        time: varchar("time").notNull().$type<`${number}-${number}-${number}`>(), // 2025-12-31
        type: varchar("type", { enum: ["receive-email", "send-email"] }).notNull(),
        value: integer("value").notNull(),
    },
    (table) => {
        return {
            pk: primaryKey({ columns: [table.time, table.type] }),
            typeIdx: index("stats_type_idx").on(table.type),
        };
    },
);
