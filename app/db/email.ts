import { relations } from 'drizzle-orm';
import { sqliteTable, int, integer, index, text } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { Mailbox, MailboxCategory, TempAlias } from './mailbox';

// The Email
export const Email = sqliteTable("emails", {
    id: text("id", { length: 24 }).primaryKey().unique().$defaultFn(() => createId()),
    mailboxId: text("mailbox_id", { length: 24 }).notNull()
        .references(() => Mailbox.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),

    subject: text("subject", { length: 255 }),
    snippet: text("snippet", { length: 255 }),
    body: text("text_body", { length: 65_535 }).notNull(),
    html: text("html", { length: 16_777_215 }),
    raw: text("raw", { length: 10, enum: ["s3", "draft"] }),
    size: int("size").default(0),

    replyTo: text("reply_to"),
    givenId: text("given_message_id"),
    givenReferences: text("given_references", { mode: "json" }).$type<string[]>(),
    categoryId: text("category_id", { length: 24 })
        .references(() => MailboxCategory.id, { onDelete: 'set null' }),
    tempId: text("temp_id", { length: 24 })
        .references(() => TempAlias.id, { onDelete: 'cascade' }),

    isSender: int("is_sender", { mode: "boolean" }).default(false).notNull(),
    isRead: int("is_read", { mode: "boolean" }).default(false).notNull(),
    isStarred: int("is_starred", { mode: "boolean" }).default(false).notNull(),

    binnedAt: int('binned_at', { mode: 'timestamp' })
}, (table) => {
    return {
        mailboxIdx: index("email_mailbox_idx").on(table.mailboxId),
        categoryIdx: index("email_category_idx").on(table.categoryId),
        isSenderIdx: index("email_sender_idx").on(table.isSender),
        isReadIdx: index("email_is_read_idx").on(table.isRead),
        isStarredIdx: index("email_is_starred_idx").on(table.isStarred),
        binnedAtIdx: index("email_binned_at_idx").on(table.binnedAt),
        tempIdIdx: index("email_temp_id_idx").on(table.tempId),
        givenIdIdx: index("email_given_id_idx").on(table.givenId),

        createdIdIdx: index("email_created_id_idx").on(table.createdAt, table.id),
    }
});

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
export const EmailSender = sqliteTable("email_senders", {
    emailId: text("email_id", { length: 24 }).notNull().primaryKey()
        .references(() => Email.id, { onDelete: 'cascade' }),
    name: text("name", { length: 255 }),
    address: text("address", { length: 255 }).notNull(),
});

export const EmailSenderRelations = relations(EmailSender, ({ one }) => ({
    email: one(Email, {
        fields: [EmailSender.emailId],
        references: [Email.id],
    }),
}));


// Email Recipients
export const EmailRecipient = sqliteTable("email_recipients", {
    id: text("id", { length: 24 }).primaryKey().unique().$defaultFn(() => createId()),
    emailId: text("email_id", { length: 24 }).notNull()
        .references(() => Email.id, { onDelete: 'cascade' }),
    name: text("name", { length: 255 }),
    address: text("address", { length: 255 }).notNull(),
    cc: int("cc", { mode: "boolean" }).default(false).notNull(),
}, (table) => {
    return {
        emailIdx: index("email_recipient_email_idx").on(table.emailId),
    }
});

export const EmailRecipientRelations = relations(EmailRecipient, ({ one }) => ({
    email: one(Email, {
        fields: [EmailRecipient.emailId],
        references: [Email.id],
    }),
}));

// Email Attachments
export const EmailAttachments = sqliteTable("email_attachments", {
    id: text("id", { length: 24 }).primaryKey().unique().$defaultFn(() => createId()),
    emailId: text("email_id", { length: 24 }).notNull()
        .references(() => Email.id, { onDelete: 'cascade' }),
    filename: text("filename", { length: 255 }).notNull(),
    mimeType: text("mime_type", { length: 25 }).notNull(),
    size: int("size").default(0).notNull(),
    title: text("title", { length: 255 }),
}, (table) => {
    return {
        emailIdx: index("email_attachment_email_idx").on(table.emailId),
    }
});

export const EmailAttachmentsRelations = relations(EmailAttachments, ({ one }) => ({
    email: one(Email, {
        fields: [EmailAttachments.emailId],
        references: [Email.id],
    }),
}));


// Draft email
export const DraftEmail = sqliteTable("draft_emails", {
    id: text("id", { length: 24 }).primaryKey().unique().$defaultFn(() => createId()),
    mailboxId: text("mailbox_id", { length: 24 }).notNull()
        .references(() => Mailbox.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
    subject: text("subject", { length: 255 }),
    body: text("text_body", { length: 65_535 }),
    from: text("from", { length: 255 }),
    to: text("to", { mode: "json" })
        .$type<{ address: string, name: string | null, cc?: "cc" | "bcc" | null }[]>(),
    headers: text("headers", { mode: "json" })
        .$type<{ key: string, value: string }[]>(),
}, (table) => {
    return {
        mailboxIdx: index("draft_mailbox_idx").on(table.mailboxId),

        createdIdIdx: index("draft_created_id_idx").on(table.createdAt, table.id),
    }
});

export const DraftEmailRelations = relations(DraftEmail, ({ one }) => ({
    mailbox: one(Mailbox, {
        fields: [DraftEmail.mailboxId],
        references: [Mailbox.id],
    }),
})); 
