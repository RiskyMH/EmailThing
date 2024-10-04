import { customType } from "drizzle-orm/sqlite-core";

export const nocaseText = (name: string, options?: { length?: number }) =>
    customType<{ data: string; driverData: undefined }>({
        dataType() {
            return `text${options?.length ? `(${options.length})` : ''} collate nocase`;
        }
    })(name);

