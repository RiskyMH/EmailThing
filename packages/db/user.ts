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
    }),
);

export const UserRelations = relations(User, ({ many, one }) => ({
    notifications: many(UserNotification),
    mailboxes: many(MailboxForUser),
    passwordResets: many(ResetPasswordToken),
    passkeys: many(PasskeyCredentials),
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
    name: text("name"),
    publicKey: text("public_key").notNull(),
});

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
    },
    (table) => {
        return {
            userIdx: index("notification_user_id").on(table.userId),
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
