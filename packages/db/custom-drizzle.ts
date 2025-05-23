import { customType } from "drizzle-orm/pg-core";

// For case-insensitive text in Postgres, use CITEXT type
// however many providers don't support it, so we use text instead :()
export const nocaseText = (name: string, options?: { length?: number }) =>
    customType<{ data: string; driverData: undefined }>({
        dataType() {
            return `text`;
        },

    })(name);

// For case-sensitive text in Postgres
export const caseSensitiveText = (name: string, options?: { length?: number }) =>
    customType<{ data: string; driverData: undefined }>({
        dataType() {
            // Use text with C collation for binary (case-sensitive) comparison
            return `varchar${options?.length ? `(${options.length})` : ""} COLLATE "C"`;
        },
    })(name);