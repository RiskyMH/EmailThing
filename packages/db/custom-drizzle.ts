import { customType } from "drizzle-orm/pg-core";

// For case-insensitive text in Postgres, use CITEXT type
export const nocaseText = (name: string, options?: { length?: number }) =>
    customType<{ data: string; driverData: undefined }>({
        dataType() {
            return `text`;
        },

    })(name);

// For case-sensitive text in Postgres
export const sensitiveText = (name: string, options?: { length?: number }) =>
    customType<{ data: string; driverData: undefined }>({
        dataType() {
            // Use text with C collation for binary (case-sensitive) comparison
            return `varchar${options?.length ? `(${options.length})` : ""} COLLATE "C"`;
        },
    })(name);
