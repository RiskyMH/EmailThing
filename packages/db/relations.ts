import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  // ================= USER
  User: {
    notifications: r.many.UserNotification({ from: r.User.id, to: r.UserNotification.userId }),
    mailboxes: r.many.MailboxForUser({ from: r.User.id, to: r.MailboxForUser.userId }),
    passwordResets: r.many.ResetPasswordToken({ from: r.User.id, to: r.ResetPasswordToken.userId }),
    passkeys: r.many.PasskeyCredentials({ from: r.User.id, to: r.PasskeyCredentials.userId }),
    sessions: r.many.UserSession({ from: r.User.id, to: r.UserSession.userId }),
  },
  UserSession: {
    user: r.one.User({ from: r.UserSession.userId, to: r.User.id }),
  },
  PasskeyCredentials: {
    user: r.one.User({ from: r.PasskeyCredentials.userId, to: r.User.id }),
  },
  UserNotification: {
    user: r.one.User({ from: r.UserNotification.userId, to: r.User.id }),
  },
  ResetPasswordToken: {
    user: r.one.User({ from: r.ResetPasswordToken.userId, to: r.User.id }),
  },

  // =============== MAILBOX
  Mailbox: {
    aliases: r.many.MailboxAlias({ from: r.Mailbox.id, to: r.MailboxAlias.mailboxId }),
    customDomains: r.many.MailboxCustomDomain({ from: r.Mailbox.id, to: r.MailboxCustomDomain.mailboxId }),
    categories: r.many.MailboxCategory({ from: r.Mailbox.id, to: r.MailboxCategory.mailboxId }),
    users: r.many.MailboxForUser({ from: r.Mailbox.id, to: r.MailboxForUser.mailboxId }),
    tempAliases: r.many.TempAlias({ from: r.Mailbox.id, to: r.TempAlias.mailboxId }),
    tokens: r.many.MailboxTokens({ from: r.Mailbox.id, to: r.MailboxTokens.mailboxId }),
  },
  MailboxAlias: {
    mailbox: r.one.Mailbox({ from: r.MailboxAlias.mailboxId, to: r.Mailbox.id }),
  },
  TempAlias: {
    mailbox: r.one.Mailbox({ from: r.TempAlias.mailboxId, to: r.Mailbox.id }),
    emails: r.many.Email({ from: r.TempAlias.id, to: r.Email.tempId }),
  },
  MailboxCustomDomain: {
    mailbox: r.one.Mailbox({ from: r.MailboxCustomDomain.mailboxId, to: r.Mailbox.id }),
  },
  MailboxTokens: {
    mailbox: r.one.Mailbox({ from: r.MailboxTokens.mailboxId, to: r.Mailbox.id }),
  },
  MailboxCategory: {
    mailbox: r.one.Mailbox({ from: r.MailboxCategory.mailboxId, to: r.Mailbox.id }),
    emails: r.many.Email({ from: r.MailboxCategory.id, to: r.Email.categoryId }),
  },
  MailboxForUser: {
    mailbox: r.one.Mailbox({ from: r.MailboxForUser.mailboxId, to: r.Mailbox.id }),
    user: r.one.User({ from: r.MailboxForUser.userId, to: r.User.id }),
  },

  // =============== EMAIL
  Email: {
    mailbox: r.one.Mailbox({ from: r.Email.mailboxId, to: r.Mailbox.id }),
    from: r.one.EmailSender({ from: r.Email.id, to: r.EmailSender.emailId }),
    recipients: r.many.EmailRecipient({ from: r.Email.id, to: r.EmailRecipient.emailId }),
    category: r.one.MailboxCategory({ from: r.Email.categoryId, to: r.MailboxCategory.id }),
    attachments: r.many.EmailAttachments({ from: r.Email.id, to: r.EmailAttachments.emailId }),
    temp: r.one.TempAlias({ from: r.Email.tempId, to: r.TempAlias.id }),
  },
  EmailSender: {
    email: r.one.Email({ from: r.EmailSender.emailId, to: r.Email.id }),
  },
  EmailRecipient: {
    email: r.one.Email({ from: r.EmailRecipient.emailId, to: r.Email.id }),
  },
  EmailAttachments: {
    email: r.one.Email({ from: r.EmailAttachments.emailId, to: r.Email.id }),
  },
  DraftEmail: {
    mailbox: r.one.Mailbox({ from: r.DraftEmail.mailboxId, to: r.Mailbox.id }),
  },
  // ========== SYSTEM
  // DefaultDomain, Stats: no extra relations needed
}));
