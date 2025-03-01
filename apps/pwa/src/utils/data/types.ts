import type { InferSelectModel } from "drizzle-orm";
import type { Email, EmailAttachments, EmailRecipient, EmailSender, Mailbox, MailboxAlias, MailboxCategory, TempAlias, DraftEmail } from "@emailthing/db";

// Core types from DB schema
export type DBEmail = InferSelectModel<typeof Email>;
export type DBEmailDraft = InferSelectModel<typeof DraftEmail>;
export type DBEmailSender = InferSelectModel<typeof EmailSender>;
export type DBEmailRecipient = InferSelectModel<typeof EmailRecipient>;
export type DBEmailAttachment = InferSelectModel<typeof EmailAttachments>;
export type DBMailbox = InferSelectModel<typeof Mailbox>;
export type DBMailboxAlias = InferSelectModel<typeof MailboxAlias>;
export type DBMailboxCategory = InferSelectModel<typeof MailboxCategory>;
export type DBTempAlias = InferSelectModel<typeof TempAlias>;

// Sync metadata
export interface SyncInfo {
  id: string;
  lastSynced: Date;
  mailboxId: string;
}
