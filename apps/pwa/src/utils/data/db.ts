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
  SyncInfo,
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

    this.version(1.1).stores({
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

        // TODO: clean up some of thse (ie see whats actually in use and could be used)
        // Two-field compound indexes
        '[mailboxId+createdAt]',
        '[mailboxId+categoryId]',
        '[mailboxId+isRead]',
        '[mailboxId+isStarred]',
        '[mailboxId+isSender]',
        '[mailboxId+binnedAt]',
        '[mailboxId+tempId]',
        // Three-field compound indexes for common queries
        '[mailboxId+categoryId+createdAt]',
        '[mailboxId+isRead+createdAt]',
        '[mailboxId+isStarred+createdAt]',
        '[mailboxId+isSender+createdAt]',
        '[mailboxId+binnedAt+createdAt]',
        '[mailboxId+tempId+createdAt]',

        '[mailboxId+categoryId+isRead]',
        '[mailboxId+categoryId+isStarred]',
        '[mailboxId+categoryId+isSender]',
        '[mailboxId+categoryId+binnedAt]',
        '[mailboxId+categoryId+tempId]',

        // 4 field compound indexes
        '[mailboxId+categoryId+isRead+createdAt]',
        '[mailboxId+categoryId+isStarred+createdAt]',
        '[mailboxId+categoryId+isSender+createdAt]',
        '[mailboxId+categoryId+binnedAt+createdAt]',
        '[mailboxId+categoryId+tempId+createdAt]', 
        
        // these are used for the actual filtering of emails on homepage
        '[mailboxId+isSender+binnedAt+tempId]',
        '[mailboxId+categoryId+isSender+binnedAt+tempId]',
        '[mailboxId+isRead+isSender+binnedAt]',
        '[mailboxId+isRead+isSender+binnedAt+tempId]',
        '[mailboxId+categoryId+isRead+isSender+binnedAt]',
        '[mailboxId+isStarred+isSender+binnedAt]',
        '[mailboxId+categoryId+isStarred+isSender+binnedAt]',
        '[mailboxId+tempId+isSender+binnedAt]',
        '[mailboxId+categoryId+tempId+isSender+binnedAt]',

        '[mailboxId+isSender+binnedAt+tempId+createdAt]',
        '[mailboxId+categoryId+isSender+binnedAt+tempId+createdAt]',
        '[mailboxId+isRead+isSender+binnedAt+createdAt]',
        '[mailboxId+categoryId+isRead+isSender+binnedAt+createdAt]',
        '[mailboxId+isStarred+isSender+binnedAt+createdAt]',
        '[mailboxId+categoryId+isStarred+isSender+binnedAt+createdAt]',
        '[mailboxId+tempId+isSender+binnedAt+createdAt]',
        '[mailboxId+categoryId+tempId+isSender+binnedAt+createdAt]',
      ].join(','),

      // Keep other tables as they were
      draftEmails: 'id,mailboxId,[mailboxId+createdAt],updatedAt',
      emailSenders: '[emailId+address],emailId,address',
      emailRecipients: '[emailId+address],emailId,address',
      emailAttachments: '[emailId+id],emailId',
      mailboxes: 'id,createdAt',
      mailboxAliases: '[mailboxId+alias],mailboxId,alias,default',
      mailboxCategories: '[mailboxId+name],mailboxId,name',
      tempAliases: '[mailboxId+alias],mailboxId,alias,expiresAt',
      user: 'id',
      passkeyCredentials: '[userId+id],userId,id',
      userNotifications: '[userId+id],userId,id',
      defaultDomains: 'id',
      mailboxForUser: '[userId+mailboxId],userId,mailboxId',
      mailboxTokens: '[mailboxId+id],mailboxId,id',
      mailboxCustomDomains: '[mailboxId+id],mailboxId,id'
    });
  }
}

export const db = new EmailDB();

// Initialize database
export async function initializeDB() {
  await db.open();
}
