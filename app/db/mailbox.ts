import { relations } from 'drizzle-orm';
import { sqliteTable, int, integer, index, text, unique, primaryKey } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { User } from './user';
import { Email } from './email';
import { nocaseText } from './custom-drizzle';

// The mailbox
export const Mailbox = sqliteTable("mailboxes", {
    id: text("mailbox_id", { length: 24 }).primaryKey().unique().$defaultFn(() => createId()),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    storageUsed: int("storage_used").default(0).notNull(),
    plan: text("plan", { enum: ["FREE", "UNLIMITED"] }).default("FREE").notNull()
});

export const MailboxRelations = relations(Mailbox, ({ many, one }) => ({
    aliases: many(MailboxAlias),
    customDomains: many(MailboxCustomDomain),
    categories: many(MailboxCategory),
    users: many(MailboxForUser),
    tempAliases: many(TempAlias),
    tokens: many(MailboxTokens),
}));


// Aliases
export const MailboxAlias = sqliteTable("mailbox_aliases", {
    id: text("id", { length: 24 }).primaryKey().unique().$defaultFn(() => createId()),
    mailboxId: text("mailbox_id", { length: 24 }).notNull()
        .references(() => Mailbox.id, { onDelete: 'cascade' }),
    alias: nocaseText("alias").notNull(),
    name: text("name"),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    default: int("default", { mode: "boolean" }).default(false).notNull()
}, (table) => {
    return {
        idx: index("mailbox_aliases_idx").on(table.mailboxId, table.default),
        unique: unique("mailbox_aliases_unique").on(table.alias, table.mailboxId),
        alias: unique("mailbox_aliases_alias").on(table.alias),
    }
});

export const MailboxAliasRelations = relations(MailboxAlias, ({ many, one }) => ({
    mailbox: one(Mailbox, {
        fields: [MailboxAlias.mailboxId],
        references: [Mailbox.id],
    })
}));

// Temp Alias (for short lived email)
export const TempAlias = sqliteTable("temp_aliases", {
    id: text("id", { length: 24 }).primaryKey().unique().$defaultFn(() => createId()),
    mailboxId: text("mailbox_id", { length: 24 }).notNull()
        .references(() => Mailbox.id, { onDelete: 'cascade' }),
    alias: nocaseText("alias").notNull(),
    name: text("name"),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
}, (table) => {
    return {
        idx: index("temp_aliases_idx").on(table.mailboxId, table.alias),
        unique: unique("temp_aliases_unique").on(table.alias, table.mailboxId),
    }
});

export const TempAliasRelations = relations(TempAlias, ({ many, one }) => ({
    mailbox: one(Mailbox, {
        fields: [TempAlias.mailboxId],
        references: [Mailbox.id],
    }),
    emails: many(Email),
}));

// Custom Domains
export const MailboxCustomDomain = sqliteTable("mailbox_custom_domain", {
    id: text("id", { length: 24 }).primaryKey().unique().$defaultFn(() => createId()),
    mailboxId: text("mailbox_id", { length: 24 }).notNull()
        .references(() => Mailbox.id, { onDelete: 'cascade' }),
    addedAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    domain: nocaseText("domain").notNull(),
}, (table) => {
    return {
        unique: unique("mailbox_custom_domain_unique").on(table.domain, table.mailboxId)
    }
});

export const MailboxCustomDomainRelations = relations(MailboxCustomDomain, ({ many, one }) => ({
    mailbox: one(Mailbox, {
        fields: [MailboxCustomDomain.mailboxId],
        references: [Mailbox.id],
    })
}));

// API Tokens
export const MailboxTokens = sqliteTable("mailbox_token", {
    id: text("id", { length: 50 }).primaryKey().unique().$defaultFn(() => createId()),
    token: text("token", { length: 50 }).unique().notNull(),
    mailboxId: text("mailbox_id", { length: 24 }).notNull()
        .references(() => Mailbox.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    expiresAt: integer('expires_at', { mode: 'timestamp' }),
    name: text("name"),
});

export const MailboxTokensRelations = relations(MailboxTokens, ({ many, one }) => ({
    mailbox: one(Mailbox, {
        fields: [MailboxTokens.mailboxId],
        references: [Mailbox.id],
    })
}));


// Categories
export const MailboxCategory = sqliteTable("mailbox_categories", {
    id: text("id", { length: 24 }).primaryKey().unique().$defaultFn(() => createId()),
    mailboxId: text("mailbox_id", { length: 24 }).notNull()
        .references(() => Mailbox.id, { onDelete: 'cascade' }),
    name: text("name").notNull(),
    color: text("color"),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => {
    return {
        mailboxIdx: index("mailbox_category_mailbox_idx").on(table.mailboxId),
    }
})

export const MailboxCategoryRelations = relations(MailboxCategory, ({ many, one }) => ({
    mailbox: one(Mailbox, {
        fields: [MailboxCategory.mailboxId],
        references: [Mailbox.id],
    }),
    emails: many(Email),
}));


// User mapping
export const MailboxForUser = sqliteTable("mailbox_for_user", {
    mailboxId: text("mailbox_id", { length: 24 }).notNull(),
        // .references(() => Mailbox.id, { onDelete: 'cascade' }),
    userId: text("user_id", { length: 24 }).notNull(),
        // .references(() => User.id, { onDelete: 'cascade' }),
    joinedAt: integer('joined_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    role: text("role", { enum: ["OWNER", "ADMIN"] }).default("ADMIN").notNull(),
}, (table) => {
    return {
        pk: primaryKey({ columns: [table.mailboxId, table.userId] })
    }
})

export const MailboxForUserRelations = relations(MailboxForUser, ({ many, one }) => ({
    mailbox: one(Mailbox, {
        fields: [MailboxForUser.mailboxId],
        references: [Mailbox.id],
    }),
    user: one(User, {
        fields: [MailboxForUser.userId],
        references: [User.id],
    })
}));
