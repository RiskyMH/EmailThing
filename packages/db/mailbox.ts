import { createId } from "@paralleldrive/cuid2";
import { relations, sql } from "drizzle-orm";
import {
    index,
    integer,
    primaryKey,
    pgTable,
    unique,
    varchar,
    timestamp,
    boolean,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { caseSensitiveText, nocaseText } from "./custom-drizzle";
import { Email } from "./email";
import { User } from "./user";

// The mailbox
export const Mailbox = pgTable("mailboxes", {
    id: varchar("mailbox_id", { length: 25 })
        .primaryKey()
        .unique()
        .$defaultFn(() => createId()),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
        // .notNull()
        .defaultNow()
        .$onUpdateFn(() => new Date()),
    storageUsed: integer("storage_used").default(0).notNull(),
    plan: varchar("plan", { enum: ["FREE", "UNLIMITED", "DEMO"] })
        .default("FREE")
        .notNull(),

    // anonymous data - but here for syncing
    isDeleted: boolean("is_deleted").default(false),
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
export const MailboxAlias = pgTable(
    "mailbox_aliases",
    {
        id: varchar("id", { length: 25 })
            .primaryKey()
            .unique()
            .$defaultFn(() => createId()),
        mailboxId: varchar("mailbox_id", { length: 25 })
            .notNull()
            .references(() => Mailbox.id, { onDelete: "cascade" }),
        alias: nocaseText("alias").notNull(),
        name: varchar("name"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at")
            // .notNull()
            .defaultNow()
            .$onUpdateFn(() => new Date()),
        default: boolean("default").default(false).notNull(),

        // anonymous data - but here for syncing
        isDeleted: boolean("is_deleted").default(false),
    },
    (table) => {
        return {
            idx: index("mailbox_aliases_idx").on(table.mailboxId, table.default),
            unique: unique("mailbox_aliases_unique").on(table.alias, table.mailboxId),
            alias: unique("mailbox_aliases_alias").on(table.alias),
            updatedMailboxIdx: index("mailbox_alias_updated_idx").on(table.updatedAt, table.mailboxId),
            aliasLower: index("mailbox_alias_alias_lower_idx").on(sql`lower(${table.alias})`),
            uniqueAlias: uniqueIndex("mailbox_alias_alias_unique").on(sql`lower(${table.alias})`),
        };
    },
);

export const MailboxAliasRelations = relations(MailboxAlias, ({ many, one }) => ({
    mailbox: one(Mailbox, {
        fields: [MailboxAlias.mailboxId],
        references: [Mailbox.id],
    }),
}));

// Temp Alias (for short lived email)
export const TempAlias = pgTable(
    "temp_aliases",
    {
        id: varchar("id", { length: 25 })
            .primaryKey()
            .unique()
            .$defaultFn(() => createId()),
        mailboxId: varchar("mailbox_id", { length: 25 })
            .notNull()
            .references(() => Mailbox.id, { onDelete: "cascade" }),
        alias: nocaseText("alias").notNull(),
        name: varchar("name"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at")
            // .notNull()
            .defaultNow()
            .$onUpdateFn(() => new Date()),
        expiresAt: timestamp("expires_at").notNull(),

        // anonymous data - but here for syncing
        isDeleted: boolean("is_deleted").default(false),
    },
    (table) => {
        return {
            idx: index("temp_aliases_idx").on(table.mailboxId, table.alias),
            unique: unique("temp_aliases_unique").on(table.alias, table.mailboxId),
            aliasLower: index("temp_aliases_alias_lower_idx").on(sql`lower(${table.alias})`),
            uniqueAlias: uniqueIndex("temp_aliases_alias_unique").on(sql`lower(${table.alias})`),
        };
    },
);

export const TempAliasRelations = relations(TempAlias, ({ many, one }) => ({
    mailbox: one(Mailbox, {
        fields: [TempAlias.mailboxId],
        references: [Mailbox.id],
    }),
    emails: many(Email),
}));

// Custom Domains
export const MailboxCustomDomain = pgTable(
    "mailbox_custom_domain",
    {
        id: varchar("id", { length: 25 })
            .primaryKey()
            .unique()
            .$defaultFn(() => createId()),
        mailboxId: varchar("mailbox_id", { length: 25 })
            .notNull()
            .references(() => Mailbox.id, { onDelete: "cascade" }),
        addedAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at")
            // .notNull()
            .defaultNow()
            .$onUpdateFn(() => new Date()),
        domain: nocaseText("domain").notNull(),

        // anonymous data - but here for syncing
        isDeleted: boolean("is_deleted").default(false),
    },
    (table) => {
        return {
            unique: unique("mailbox_custom_domain_unique").on(table.domain, table.mailboxId),
            updatedMailboxIdx: index("mailbox_domain_updated_idx").on(table.updatedAt, table.mailboxId),
            domainLower: index("mailbox_domain_domain_lower_idx").on(sql`lower(${table.domain})`),
            uniqueDomain: uniqueIndex("mailbox_domain_domain_unique").on(sql`lower(${table.domain})`),
        };
    },
);

export const MailboxCustomDomainRelations = relations(MailboxCustomDomain, ({ many, one }) => ({
    mailbox: one(Mailbox, {
        fields: [MailboxCustomDomain.mailboxId],
        references: [Mailbox.id],
    }),
}));

// API Tokens
export const MailboxTokens = pgTable(
    "mailbox_token",
    {
        id: varchar("id", { length: 50 })
            .primaryKey()
            .unique()
            .$defaultFn(() => createId()),
        token: caseSensitiveText("token", { length: 50 }).unique().notNull(),
        mailboxId: varchar("mailbox_id", { length: 25 })
            .notNull()
            .references(() => Mailbox.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdateFn(() => new Date()),
        expiresAt: timestamp("expires_at"),
        name: varchar("name"),
        isDeleted: boolean("is_deleted").default(false),
    },
    (table) => ({
        updatedMailboxIdx: index("mailbox_token_updated_idx").on(table.updatedAt, table.mailboxId),
    }),
);

export const MailboxTokensRelations = relations(MailboxTokens, ({ many, one }) => ({
    mailbox: one(Mailbox, {
        fields: [MailboxTokens.mailboxId],
        references: [Mailbox.id],
    }),
}));

// Categories
export const MailboxCategory = pgTable(
    "mailbox_categories",
    {
        id: varchar("id", { length: 25 })
            .primaryKey()
            .unique()
            .$defaultFn(() => createId()),
        mailboxId: varchar("mailbox_id", { length: 25 })
            .notNull()
            .references(() => Mailbox.id, { onDelete: "cascade" }),
        name: varchar("name").notNull(),
        color: varchar("color"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at")
            // .notNull()
            .defaultNow()
            .$onUpdateFn(() => new Date()),

        // anonymous data - but here for syncing
        isDeleted: boolean("is_deleted").default(false),
    },
    (table) => {
        return {
            mailboxIdx: index("mailbox_category_mailbox_idx").on(table.mailboxId),
            updatedMailboxIdx: index("mailbox_category_updated_idx").on(table.updatedAt, table.mailboxId),
        };
    },
);

export const MailboxCategoryRelations = relations(MailboxCategory, ({ many, one }) => ({
    mailbox: one(Mailbox, {
        fields: [MailboxCategory.mailboxId],
        references: [Mailbox.id],
    }),
    emails: many(Email),
}));

// User mapping
export const MailboxForUser = pgTable(
    "mailbox_for_user",
    {
        mailboxId: varchar("mailbox_id", { length: 25 }).notNull(),
        // .references(() => Mailbox.id, { onDelete: 'cascade' }),
        userId: varchar("user_id", { length: 25 }).notNull(),
        // .references(() => User.id, { onDelete: 'cascade' }),
        joinedAt: timestamp("joined_at").notNull().defaultNow(),
        role: varchar("role", { enum: ["OWNER", "ADMIN", "NONE"] })
            .default("ADMIN")
            .notNull(),
        updatedAt: timestamp("updated_at")
            // .notNull()
            .defaultNow()
            .$onUpdateFn(() => new Date()),

        // anonymous data - but here for syncing
        isDeleted: boolean("is_deleted").default(false),
    },
    (table) => {
        return {
            pk: primaryKey({ columns: [table.mailboxId, table.userId] }),
            userJoinedIdx: index("mailbox_user_joined_idx").on(table.userId, table.joinedAt),
            userUpdatedIdx: index("mailbox_user_updated_idx").on(table.userId, table.updatedAt),
        };
    },
);

export const MailboxForUserRelations = relations(MailboxForUser, ({ many, one }) => ({
    mailbox: one(Mailbox, {
        fields: [MailboxForUser.mailboxId],
        references: [Mailbox.id],
    }),
    user: one(User, {
        fields: [MailboxForUser.userId],
        references: [User.id],
    }),
}));
