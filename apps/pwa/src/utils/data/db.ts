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
  syncInfo!: Table<SyncInfo, string>;

  constructor() {
    super('EmailDB');

    this.version(1).stores({
      // Optimize email indexes for common query patterns
      emails: [
        'id',
        'mailboxId',
        '*categoryId',
        // Primary compound indexes for list views
        '[mailboxId+isSender+createdAt]',
        '[mailboxId+binnedAt+createdAt]',
        '[mailboxId+isStarred+createdAt]',
        // Category filtering with other conditions
        '[mailboxId+categoryId+createdAt]',
        '[mailboxId+categoryId+isRead]',
        // Status indexes
        '[mailboxId+isRead]',
        '[mailboxId+tempId]'
      ].join(','),

      draftEmails: 'id,mailboxId,[mailboxId+createdAt],*updatedAt',

      // Keep other tables as they were
      emailSenders: '[emailId+address],emailId,*address',
      emailRecipients: '[emailId+address],emailId,*address',
      emailAttachments: '[emailId+id],emailId',
      mailboxes: 'id,*createdAt',
      mailboxAliases: '[mailboxId+alias],mailboxId,*alias,*default',
      mailboxCategories: '[mailboxId+name],mailboxId,*name',
      tempAliases: '[mailboxId+alias],mailboxId,*alias,*expiresAt',
      syncInfo: 'id,*lastSynced',
      user: 'id',
      passkeyCredentials: '[userId+id],userId,id',
      userNotifications: '[userId+id],userId,id',
      defaultDomains: 'id',
      mailboxForUser: '[userId+mailboxId],userId,mailboxId',
      mailboxTokens: '[mailboxId+id],mailboxId,id',
      mailboxCustomDomains: '[mailboxId+id],mailboxId,id'
    });
  }

  // Helper methods for sync
  async getLastSync(mailboxId: string): Promise<Date | null> {
    const info = await this.syncInfo.get(mailboxId);
    return info?.lastSynced ?? null;
  }

  async updateLastSync(mailboxId: string): Promise<void> {
    await this.syncInfo.put({
      id: mailboxId,
      lastSynced: new Date()
    });
  }

  // Bulk upsert helpers
  async bulkUpsertEmails(emails: DBEmail[]): Promise<void> {
    await this.emails.bulkPut(emails);
  }

  async bulkUpsertSenders(senders: DBEmailSender[]): Promise<void> {
    await this.emailSenders.bulkPut(senders);
  }

  async bulkUpsertRecipients(recipients: DBEmailRecipient[]): Promise<void> {
    await this.emailRecipients.bulkPut(recipients);
  }

  async bulkUpsertAttachments(attachments: DBEmailAttachment[]): Promise<void> {
    await this.emailAttachments.bulkPut(attachments);
  }
}

export const db = new EmailDB();

// Initialize database
export async function initializeDB() {
  await db.open();
}
