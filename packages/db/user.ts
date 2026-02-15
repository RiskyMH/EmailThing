import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import { boolean, index, json, pgTable, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { caseSensitiveText, nocaseText } from "./custom-drizzle";

// The User
export const User = pgTable(
    "users",
    {
        id: varchar("id", { length: 25 })
            .unique()
            .$defaultFn(() => createId())
            .primaryKey(),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at")
            // .notNull()
            .defaultNow()
            .$onUpdateFn(() => new Date()),
        username: nocaseText("username", { length: 20 }).notNull(),
        password: varchar("password", { length: 200 }).notNull(),
        admin: boolean("admin").default(false),
        email: varchar("email").notNull(),
        onboardingStatus: json("onboarding_status").$type<{ initial: boolean }>().default({ initial: false }),
        backupEmail: varchar("backup_email"),
        publicEmail: varchar("public_email"),
        publicContactPage: boolean("public_contact_page").default(false),
    },
    (table) => ({
        usernameIdx: index("user_username").on(table.username),
        updatedAtIdx: index("user_updated_at_idx").on(table.updatedAt),
        usernameLower: index("user_username_lower_idx").on(sql`lower(${table.username})`),
        uniqueUsername: uniqueIndex("user_username_unique").on(sql`lower(${table.username})`),
    }),
);

// user session
export const UserSession = pgTable(
    "user_sessions",
    {
        id: varchar("id", { length: 25 })
            .unique()
            .$defaultFn(() => createId())
            .primaryKey(),
        userId: varchar("user_id", { length: 25 })
            .notNull()
            .references(() => User.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at")
            .notNull()
            .$defaultFn(() => new Date()),
        token: caseSensitiveText("token", { length: 100 })
            .notNull()
            .unique()
            .$defaultFn(() => createId()),
        tokenExpiresAt: timestamp("token_expires_at").notNull(),
        refreshToken: caseSensitiveText("refresh_token", { length: 100 }).notNull().unique(),
        refreshTokenExpiresAt: timestamp("refresh_token_expires_at").notNull(),
        sudoExpiresAt: timestamp("sudo_expires_at"),
        method: varchar("method", { enum: ["password", "passkey"] }).notNull(),
    },
    (table) => ({
        tokenIdx: index("token_idx").on(table.token, table.tokenExpiresAt),
        refreshTokenIdx: index("refresh_token_idx").on(table.refreshToken, table.refreshTokenExpiresAt),
    }),
);

// passkeys
export const PasskeyCredentials = pgTable(
    "passkey_credentials",
    {
        id: varchar("id", { length: 25 })
            .unique()
            .$defaultFn(() => createId())
            .primaryKey(),
        userId: varchar("user_id", { length: 25 })
            .notNull()
            .references(() => User.id, { onDelete: "cascade" }),
        credentialId: varchar("credential_id").notNull().notNull(),
        createdAt: timestamp("created_at")
            .notNull()
            .$defaultFn(() => new Date()),
        updatedAt: timestamp("updated_at")
            // .notNull()
            .$defaultFn(() => new Date())
            .$onUpdateFn(() => new Date()),
        name: varchar("name"),
        publicKey: varchar("public_key").notNull(),
        isDeleted: boolean("is_deleted").default(false),
    },
    (table) => ({
        userCreatedIdx: index("passkey_user_created_idx").on(table.userId, table.createdAt),
        userUpdatedIdx: index("passkey_user_updated_idx").on(table.userId, table.updatedAt),
    }),
);

// Notifications
export const UserNotification = pgTable(
    "user_notifications",
    {
        id: varchar("id", { length: 25 })
            .primaryKey()
            .unique()
            .$defaultFn(() => createId()),
        endpoint: varchar("endpoint", { length: 512 }).notNull().unique(),
        userId: varchar("user_id", { length: 25 })
            .notNull()
            .references(() => User.id, { onDelete: "cascade" }),
        p256dh: varchar("p256dh").notNull(),
        auth: varchar("auth").notNull(),
        createdAt: timestamp("created_at")
            .notNull()
            .$defaultFn(() => new Date()),
        expiresAt: timestamp("expires_at"),
        isDeleted: boolean("is_deleted").default(false),
    },
    (table) => {
        return {
            userIdx: index("notification_user_id").on(table.userId),
            userCreatedIdx: index("notification_user_created_idx").on(table.userId, table.createdAt),
        };
    },
);


// Invite codes
export const InviteCode = pgTable("invite_codes", {
    code: varchar("code", { length: 25 })
        .primaryKey()
        .unique()
        .$defaultFn(() => createId()),
    createdBy: varchar("created_by", { length: 25 }).notNull(),
    createdAt: timestamp("created_at")
        .notNull()
        .$defaultFn(() => new Date()),
    expiresAt: timestamp("expires_at"),
    usedBy: varchar("used_by", { length: 25 }),
    usedAt: timestamp("used_at"),
});
