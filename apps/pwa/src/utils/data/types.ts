import type { InferSelectModel } from "drizzle-orm";
import type { Email, EmailAttachments, EmailRecipient, EmailSender, Mailbox, MailboxAlias, MailboxCategory, TempAlias, DraftEmail, MailboxTokens, DefaultDomain, MailboxForUser, PasskeyCredentials, User, UserNotification, MailboxCustomDomain } from "@emailthing/db";

type T<Obj> = {
  [K in keyof Obj]: null extends Obj[K]
  ? 0 | (Obj[K] extends null | infer U ? U extends false ? 0 : U extends true ? 1 : U extends boolean ? 1 | 0 : U : any)
  : Obj[K] extends false
  ? 0
  : Obj[K] extends true
  ? 1
  : Obj[K] extends boolean
  ? 1 | 0
  : Obj[K]
};

// Core types from DB schema
export type DBEmail = T<InferSelectModel<typeof Email>>;
export type DBEmailDraft = T<InferSelectModel<typeof DraftEmail>>;
export type DBEmailSender = T<InferSelectModel<typeof EmailSender>>;
export type DBEmailRecipient = T<InferSelectModel<typeof EmailRecipient>>;
export type DBEmailAttachment = T<InferSelectModel<typeof EmailAttachments>>;
export type DBMailbox = T<InferSelectModel<typeof Mailbox>>;
export type DBMailboxAlias = T<InferSelectModel<typeof MailboxAlias>>;
export type DBMailboxCategory = T<InferSelectModel<typeof MailboxCategory>>;
export type DBMailboxCustomDomain = T<InferSelectModel<typeof MailboxCustomDomain>>;
export type DBTempAlias = T<InferSelectModel<typeof TempAlias>>;
export type DBMailboxTokens = T<InferSelectModel<typeof MailboxTokens>>; // token anonymized - et__abc......wxyZ
export type DBMailboxForUser = T<InferSelectModel<typeof MailboxForUser>>;
export type DBDefaultDomain = Omit<T<InferSelectModel<typeof DefaultDomain>>, "authKey">; // readonly but to power some dropdowns
export type DBUser = T<Omit<InferSelectModel<typeof User>, "password">>;
export type DBPasskeyCredentials = T<Omit<InferSelectModel<typeof PasskeyCredentials>, "publicKey">>;
export type DBUserNotification = T<Omit<InferSelectModel<typeof UserNotification>, "endpoint" | "p256dh" | "auth">>;



// Sync metadata
export interface SyncInfo {
  id: string;
  lastSynced: Date;
  // mailboxId: string;
}
