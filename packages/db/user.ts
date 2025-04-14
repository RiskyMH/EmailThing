import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { index, int, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { nocaseText } from "./custom-drizzle";
import { MailboxForUser } from "./mailbox";

// The User
export const User = sqliteTable(
    "users",
    {
        id: text("id", { length: 24 })
            .unique()
            .$defaultFn(() => createId())
            .primaryKey(),
        createdAt: int("created_at", { mode: "timestamp" })
            .notNull()
            .$defaultFn(() => new Date()),
        updatedAt: int("updated_at", { mode: "timestamp" })
            // .notNull()
            .$defaultFn(() => new Date())
            .$onUpdateFn(() => new Date()),
        username: nocaseText("username", { length: 20 }).notNull(),
        password: text("password", { length: 200 }).notNull(),
        admin: int("admin", { mode: "boolean" }).default(false),
        email: text("email").notNull(),
        onboardingStatus: text("onboarding_status", { mode: "json" })
            .$type<{ initial: boolean }>()
            .default({ initial: false }),
        backupEmail: text("backup_email"),
        publicEmail: text("public_email"),
        publicContactPage: int("public_contact_page", {
            mode: "boolean",
        }).default(false),
    },
    (table) => ({
        usernameIdx: index("user_username").on(table.username),
        updatedAtIdx: index("user_updated_at_idx").on(table.updatedAt),
    }),
);

export const UserRelations = relations(User, ({ many, one }) => ({
    notifications: many(UserNotification),
    mailboxes: many(MailboxForUser),
    passwordResets: many(ResetPasswordToken),
    passkeys: many(PasskeyCredentials),
    sessions: many(UserSession),
}));

// user session
export const UserSession = sqliteTable("user_sessions", {
    id: text("id", { length: 24 })
        .unique()
        .$defaultFn(() => createId())
        .primaryKey(),
    userId: text("user_id", { length: 24 })
        .notNull()
        .references(() => User.id, { onDelete: "cascade" }),
    createdAt: int("created_at", { mode: "timestamp" })
        .notNull()
        .$defaultFn(() => new Date()),
    lastUsed: text("last_used", { mode: "json" })
        .$type<{ date: Date, ip: string, ua: string, location: string }>()
        .default({ date: new Date(), ip: "", ua: "", location: "" }),
    token: text("token", { length: 24 })
        .notNull()
        .unique()
        .$defaultFn(() => createId()),
    tokenExpiresAt: int("token_expires_at", { mode: "timestamp" })
        .notNull(),
    refreshToken: text("refresh_token", { length: 24 })
        .notNull()
        .unique(),
    refreshTokenExpiresAt: int("refresh_token_expires_at", { mode: "timestamp" })
        .notNull(),
    sudoExpiresAt: int("sudo_expires_at", { mode: "timestamp" }),
    method: text("method", { length: 24, enum: ["password", "passkey"] }).notNull(),
}, (table) => ({
    tokenIdx: index("token_idx").on(table.token, table.tokenExpiresAt),
    refreshTokenIdx: index("refresh_token_idx").on(table.refreshToken, table.refreshTokenExpiresAt),
}));

export const UserSessionRelations = relations(UserSession, ({ one }) => ({
    user: one(User, {
        fields: [UserSession.userId],
        references: [User.id],
    }),
}));

// passkeys
export const PasskeyCredentials = sqliteTable("passkey_credentials", {
    id: text("id", { length: 24 })
        .unique()
        .$defaultFn(() => createId())
        .primaryKey(),
    userId: text("user_id", { length: 24 })
        .notNull()
        .references(() => User.id, { onDelete: "cascade" }),
    credentialId: text("credential_id").notNull().notNull(),
    createdAt: int("created_at", { mode: "timestamp" })
        .notNull()
        .$defaultFn(() => new Date()),
    updatedAt: int("updated_at", { mode: "timestamp" })
        // .notNull()
        .$defaultFn(() => new Date())
        .$onUpdateFn(() => new Date()),
    name: text("name"),
    publicKey: text("public_key").notNull(),
    isDeleted: int("is_deleted", { mode: "boolean" }).default(false),
},
(table) => ({
    userCreatedIdx: index("passkey_user_created_idx").on(table.userId, table.createdAt),
    userUpdatedIdx: index("passkey_user_updated_idx").on(table.userId, table.updatedAt),
}),
);

export const PasskeyCredentialsSchemaRelations = relations(PasskeyCredentials, ({ many, one }) => ({
    user: one(User, {
        fields: [PasskeyCredentials.userId],
        references: [User.id],
    }),
}));

// Notifications
export const UserNotification = sqliteTable(
    "user_notifications",
    {
        id: text("id", { length: 24 })
            .primaryKey()
            .unique()
            .$defaultFn(() => createId()),
        endpoint: text("endpoint", { length: 512 }).notNull().unique(),
        userId: text("user_id", { length: 24 })
            .notNull()
            .references(() => User.id, { onDelete: "cascade" }),
        p256dh: text("p256dh").notNull(),
        auth: text("auth").notNull(),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .$defaultFn(() => new Date()),
        expiresAt: integer("expires_at", { mode: "timestamp" }),
        isDeleted: int("is_deleted", { mode: "boolean" }).default(false),
    },
    (table) => {
        return {
            userIdx: index("notification_user_id").on(table.userId),
            userCreatedIdx: index("notification_user_created_idx").on(table.userId, table.createdAt),
        };
    },
);

export const UserNotificationRelations = relations(UserNotification, ({ many, one }) => ({
    user: one(User, {
        fields: [UserNotification.userId],
        references: [User.id],
    }),
}));

// Reset password tokens
export const ResetPasswordToken = sqliteTable(
    "reset_password_tokens",
    {
        token: text("token", { length: 24 })
            .primaryKey()
            .unique()
            .$defaultFn(() => createId()),
        userId: text("user_id", { length: 24 })
            .notNull()
            .references(() => User.id, { onDelete: "cascade" }),
        createdAt: integer("created_at", { mode: "timestamp" })
            .notNull()
            .$defaultFn(() => new Date()),
        expiresAt: integer("expires_at", { mode: "timestamp" }),
    },
    (table) => ({
        userIdx: index("reset_password_user_id").on(table.userId),
    }),
);

export const ResetPasswordTokenRelations = relations(ResetPasswordToken, ({ many, one }) => ({
    user: one(User, {
        fields: [ResetPasswordToken.userId],
        references: [User.id],
    }),
}));

// Invite codes
export const InviteCode = sqliteTable("invite_codes", {
    code: text("code", { length: 24 })
        .primaryKey()
        .unique()
        .$defaultFn(() => createId()),
    createdBy: text("created_by", { length: 24 }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .$defaultFn(() => new Date()),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
    usedBy: text("used_by", { length: 24 }),
    usedAt: integer("used_at", { mode: "timestamp" }),
});
