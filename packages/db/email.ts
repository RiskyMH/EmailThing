import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { index, integer, pgTable, varchar, boolean, timestamp, json, text } from "drizzle-orm/pg-core";
import { Mailbox, MailboxCategory, TempAlias } from "./mailbox";

// The Email
export const Email = pgTable(
    "emails",
    {
        id: varchar("id", { length: 25 })
            .primaryKey()
            .unique()
            .$defaultFn(() => createId()),
        mailboxId: varchar("mailbox_id", { length: 25 })
            .notNull()
            .references(() => Mailbox.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at")
            .notNull()
            .defaultNow(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .notNull()
            .$onUpdateFn(() => new Date()),

        subject: text("subject", {  }),
        snippet: varchar("snippet", { length: 255 }),
        body: text("text_body", {  }).notNull(),
        html: text("html", {  }),
        raw: varchar("raw", { length: 10, enum: ["s3", "draft"] }),
        size: integer("size").default(0),

        replyTo: varchar("reply_to"),
        givenId: varchar("given_message_id"),
        givenReferences: json("given_references").$type<string[]>(),
        categoryId: varchar("category_id", { length: 25 }).references(() => MailboxCategory.id, { onDelete: "set null" }),
        tempId: varchar("temp_id", { length: 25 }).references(() => TempAlias.id, {
            onDelete: "cascade",
        }),

        isSender: boolean("is_sender").default(false).notNull(),
        isRead: boolean("is_read").default(false).notNull(),
        isStarred: boolean("is_starred").default(false).notNull(),

        binnedAt: timestamp("binned_at"),

        // anonymous data - but here for syncing
        isDeleted: boolean("is_deleted").default(false).notNull(),
    },
    (table) => {
        return {
            mailboxIdx: index("email_mailbox_idx").on(table.mailboxId),
            categoryIdx: index("email_category_idx").on(table.categoryId),
            isSenderIdx: index("email_sender_idx").on(table.isSender),
            isReadIdx: index("email_is_read_idx").on(table.isRead),
            isStarredIdx: index("email_is_starred_idx").on(table.isStarred),
            binnedAtIdx: index("email_binned_at_idx").on(table.binnedAt),
            tempIdIdx: index("email_temp_id_idx").on(table.tempId),
            givenIdIdx: index("email_given_id_idx").on(table.givenId),
            allIdx: index("email_all_idx").on(
                table.mailboxId,
                table.binnedAt,
                table.isSender,
                table.categoryId,
                table.isStarred,
                table.tempId,
                table.createdAt,
                table.id,
            ),
            all2Idx: index("email_all2_idx").on(
                table.mailboxId,
                table.binnedAt,
                table.isSender,
                table.tempId,
                table.createdAt,
                table.id,
            ),

            createdIdIdx: index("email_created_id_idx").on(table.createdAt, table.id),
            updatedAtIdx: index("email_updated_at_idx").on(table.updatedAt),
            updatedMailboxIdx: index("email_updated_mailbox_idx").on(table.updatedAt, table.mailboxId),
        };
    },
);

export const EmailRelations = relations(Email, ({ many, one }) => ({
    mailbox: one(Mailbox, {
        fields: [Email.mailboxId],
        references: [Mailbox.id],
    }),
    from: one(EmailSender, {
        fields: [Email.id],
        references: [EmailSender.emailId],
    }),
    recipients: many(EmailRecipient),
    category: one(MailboxCategory, {
        fields: [Email.categoryId],
        references: [MailboxCategory.id],
    }),
    attachments: many(EmailAttachments),
    temp: one(TempAlias, {
        fields: [Email.tempId],
        references: [TempAlias.id],
    }),
}));

// Email sender
export const EmailSender = pgTable("email_senders", {
    emailId: varchar("email_id", { length: 25 })
        .notNull()
        .primaryKey()
        .references(() => Email.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 20_055 }),
    address: varchar("address", { length: 20_055 }).notNull(),
});

export const EmailSenderRelations = relations(EmailSender, ({ one }) => ({
    email: one(Email, {
        fields: [EmailSender.emailId],
        references: [Email.id],
    }),
}));

// Email Recipients
export const EmailRecipient = pgTable(
    "email_recipients",
    {
        id: varchar("id", { length: 25 })
            .primaryKey()
            .unique()
            .$defaultFn(() => createId()),
        emailId: varchar("email_id", { length: 25 })
            .notNull()
            .references(() => Email.id, { onDelete: "cascade" }),
        name: varchar("name", { length: 20_255 }),
        address: varchar("address", { length: 20_255 }).notNull(),
        cc: boolean("cc").default(false).notNull(),
    },
    (table) => {
        return {
            emailIdx: index("email_recipient_email_idx").on(table.emailId),
        };
    },
);

export const EmailRecipientRelations = relations(EmailRecipient, ({ one }) => ({
    email: one(Email, {
        fields: [EmailRecipient.emailId],
        references: [Email.id],
    }),
}));

// Email Attachments
export const EmailAttachments = pgTable(
    "email_attachments",
    {
        id: varchar("id", { length: 25 })
            .primaryKey()
            .unique()
            .$defaultFn(() => createId()),
        emailId: varchar("email_id", { length: 25 })
            .notNull()
            .references(() => Email.id, { onDelete: "cascade" }),
        filename: varchar("filename", { length: 20_255 }).notNull(),
        mimeType: varchar("mime_type", { length: 25 }).notNull(),
        size: integer("size").default(0).notNull(),
        title: varchar("title", { length: 20_255 }),
    },
    (table) => {
        return {
            emailIdx: index("email_attachment_email_idx").on(table.emailId),
        };
    },
);

export const EmailAttachmentsRelations = relations(EmailAttachments, ({ one }) => ({
    email: one(Email, {
        fields: [EmailAttachments.emailId],
        references: [Email.id],
    }),
}));

// Draft email
export const DraftEmail = pgTable(
    "draft_emails",
    {
        id: varchar("id", { length: 25 })
            .primaryKey()
            .unique()
            .$defaultFn(() => createId()),
        mailboxId: varchar("mailbox_id", { length: 25 })
            .notNull()
            .references(() => Mailbox.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at")
            .notNull()
            .defaultNow(),
        updatedAt: timestamp("updated_at")
            .notNull()
            .defaultNow()
            .$onUpdateFn(() => new Date()),
        subject: varchar("subject", { length: 255 }),
        body: varchar("text_body", { length: 65_535 }),
        from: varchar("from", { length: 255 }),
        to: json("to").$type<{ address: string; name: string | null; cc?: "cc" | "bcc" | null }[]>(),
        headers: json("headers").$type<{ key: string; value: string }[]>(),

        // anonymous data - but here for syncing
        isDeleted: boolean("is_deleted").default(false).notNull(),
    },
    (table) => {
        return {
            mailboxIdx: index("draft_mailbox_idx").on(table.mailboxId),

            createdIdIdx: index("draft_created_id_idx").on(table.createdAt, table.id),
            updatedMailboxIdx: index("draft_updated_mailbox_idx").on(table.updatedAt, table.mailboxId),
        };
    },
);

export const DraftEmailRelations = relations(DraftEmail, ({ one }) => ({
    mailbox: one(Mailbox, {
        fields: [DraftEmail.mailboxId],
        references: [Mailbox.id],
    }),
}));
