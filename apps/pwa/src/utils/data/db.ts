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
  DBEmailDraft
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
  syncInfo!: Table<SyncInfo, string>;

  constructor() {
    super('EmailDB');
    
    this.version(1).stores({
      // Main email table with indexes
      emails: 'id, mailboxId, *categoryId, *tempId, createdAt, *isRead, *isStarred, *binnedAt',
      draftEmails: 'id, mailboxId, createdAt',

      // Related email data
      emailSenders: 'emailId, address',
      emailRecipients: 'id, emailId, address',
      emailAttachments: 'id, emailId',
      
      // Mailbox related tables
      mailboxes: 'id, createdAt',
      mailboxAliases: 'id, mailboxId, alias',
      mailboxCategories: 'id, mailboxId, name',
      tempAliases: 'id, mailboxId, alias, expiresAt',
      
      // Sync metadata
      syncInfo: 'id, mailboxId, lastSynced'
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
      mailboxId,
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
