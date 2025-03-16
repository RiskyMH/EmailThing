import type { InferSelectModel } from "drizzle-orm";
import type { Email, EmailAttachments, EmailRecipient, EmailSender, Mailbox, MailboxAlias, MailboxCategory, TempAlias, DraftEmail, MailboxTokens, DefaultDomain, MailboxForUser, PasskeyCredentials, User, UserNotification, MailboxCustomDomain } from "@emailthing/db";



// Core types from DB schema
export type DBEmail = InferSelectModel<typeof Email>;
export type DBEmailDraft = InferSelectModel<typeof DraftEmail>;
export type DBEmailSender = InferSelectModel<typeof EmailSender>;
export type DBEmailRecipient = InferSelectModel<typeof EmailRecipient>;
export type DBEmailAttachment = InferSelectModel<typeof EmailAttachments>;
export type DBMailbox = InferSelectModel<typeof Mailbox>;
export type DBMailboxAlias = InferSelectModel<typeof MailboxAlias>;
export type DBMailboxCategory = InferSelectModel<typeof MailboxCategory>;
export type DBMailboxCustomDomain = InferSelectModel<typeof MailboxCustomDomain>;
export type DBTempAlias = InferSelectModel<typeof TempAlias>;
export type DBMailboxTokens = InferSelectModel<typeof MailboxTokens> // token anonymized - et__abc......wxyZ
export type DBMailboxForUser = InferSelectModel<typeof MailboxForUser>;
export type DBDefaultDomain = Omit<InferSelectModel<typeof DefaultDomain>, "authKey">; // readonly but to power some dropdowns
export type DBUser = Omit<InferSelectModel<typeof User>, "password">;
export type DBPasskeyCredentials = Omit<InferSelectModel<typeof PasskeyCredentials>, "publicKey">;
export type DBUserNotification = Omit<InferSelectModel<typeof UserNotification>, "endpoint" | "p256dh" | "auth">;



// Sync metadata
export interface SyncInfo {
  id: string;
  lastSynced: Date;
  // mailboxId: string;
}
