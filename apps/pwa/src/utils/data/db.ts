import Dexie, { Table } from 'dexie';
import type {
  DBEmail,
  DBEmailSender,
  DBEmailRecipient,
  DBEmailAttachment,
  DBMailbox,
  DBMailboxAlias,
  DBMailboxCategory,
  DBTempAlias,
  DBEmailDraft,
  DBMailboxCustomDomain,
  DBMailboxTokens,
  DBDefaultDomain,
  DBPasskeyCredentials,
  DBUser,
  DBUserNotification,
  DBMailboxForUser
} from './types';

export class EmailDB extends Dexie {
  // Tables
  emails!: Table<DBEmail, string>;
  draftEmails!: Table<DBEmailDraft, string>;
  emailSenders!: Table<DBEmailSender, string>;
  emailRecipients!: Table<DBEmailRecipient, string>;
  emailAttachments!: Table<DBEmailAttachment, string>;
  mailboxes!: Table<DBMailbox, string>;
  mailboxAliases!: Table<DBMailboxAlias, string>;
  mailboxCategories!: Table<DBMailboxCategory, string>;
  tempAliases!: Table<DBTempAlias, string>;
  mailboxTokens!: Table<DBMailboxTokens, string>;
  mailboxCustomDomains!: Table<DBMailboxCustomDomain, string>;
  user!: Table<DBUser, string>;
  passkeyCredentials!: Table<DBPasskeyCredentials, string>;
  userNotifications!: Table<DBUserNotification, string>;
  defaultDomains!: Table<DBDefaultDomain, string>;
  mailboxForUser!: Table<DBMailboxForUser, string>;

  constructor() {
    super('EmailDB');

    this.version(1).stores({
      // Add comprehensive indexes for emails
      emails: [
        // Primary key
        'id',
        // Basic indexes
        'mailboxId',
        'categoryId',
        'isRead',
        'isStarred',
        'isSender',
        'binnedAt',
        'tempId',
        'createdAt',

        '[id+mailboxId]',
        '[mailboxId+createdAt]',
        '[mailboxId+isDeleted]',
        '[mailboxId+createdAt+deletedAt+isDeleted]',

        '[mailboxId+categoryId+isSender+binnedAt+tempId+isDeleted+createdAt]',
        '[mailboxId+isSender+binnedAt+tempId+isDeleted+createdAt]',
        '[mailboxId+categoryId+binnedAt+tempId+isDeleted+createdAt]',
        '[mailboxId+binnedAt+tempId+isDeleted+createdAt]',
        '[mailboxId+categoryId+isStarred+isSender+binnedAt+tempId+isDeleted+createdAt]',
        '[mailboxId+isStarred+isSender+binnedAt+tempId+isDeleted+createdAt]',
        '[mailboxId+categoryId+tempId+isSender+binnedAt+isDeleted+createdAt]',
        '[mailboxId+tempId+isSender+binnedAt+isDeleted+createdAt]',

        '[mailboxId+isSender+binnedAt+tempId+isDeleted]',
        '[mailboxId+binnedAt+tempId+isDeleted]',
        '[mailboxId+isStarred+isSender+binnedAt+tempId+isDeleted]',
        '[mailboxId+tempId+isSender+binnedAt+tempId+isDeleted]',
        '[mailboxId+categoryId+isSender+binnedAt+tempId+isDeleted]',
        '[mailboxId+categoryId+binnedAt+isDeleted]',
        '[mailboxId+categoryId+isStarred+isSender+binnedAt+isDeleted]',
        '[mailboxId+categoryId+tempId+isSender+binnedAt+isDeleted]',
        '[mailboxId+isRead+isSender+binnedAt+tempId+isDeleted]',
      ].join(','),

      // Keep other tables as they were
      draftEmails: 'id,mailboxId,[mailboxId+createdAt],[id+mailboxId],[mailboxId+deletedAt],updatedAt,[mailboxId+createdAt+isDeleted],[mailboxId+isDeleted]',
      emailSenders: 'emailId,[emailId+address],emailId,address',
      emailRecipients: 'id,[emailId+address],emailId,address',
      emailAttachments: 'id,[emailId+id],emailId',
      mailboxes: 'id,createdAt',
      mailboxAliases: 'id,[mailboxId+alias],mailboxId,alias,default,[mailboxId+default]',
      mailboxCategories: 'id,[mailboxId+name],mailboxId,name,[mailboxId+isDeleted]',
      tempAliases: 'id,[mailboxId+alias],mailboxId,alias,expiresAt',
      user: 'id',
      passkeyCredentials: 'id,[userId+id],userId,id',
      userNotifications: 'id,[userId+id],userId,id',
      defaultDomains: 'id',
      mailboxForUser: '[userId+mailboxId],userId,mailboxId',
      mailboxTokens: 'id,[mailboxId+id],mailboxId,id',
      mailboxCustomDomains: 'id,[mailboxId+id],mailboxId,id'
    });
  }
}

export const db = new EmailDB();

// Initialize database
export async function initializeDB() {
  await db.open();
}
