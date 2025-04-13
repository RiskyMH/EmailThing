import Dexie, { Table } from 'dexie';
import type {
  DBEmail,
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
  DBMailboxForUser,
  LocalSyncData,
} from './types';
import { fetchSync, refreshToken, syncLocal } from './sync-user';

export class EmailDB extends Dexie {
  // Tables
  emails!: Table<DBEmail, string>;
  draftEmails!: Table<DBEmailDraft, string>;
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
  localSyncData!: Table<LocalSyncData, string>;

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
        '[mailboxId+isDeleted+createdAt]',

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
        '[mailboxId+categoryId+isSender+binnedAt+tempId+isDeleted]',
        '[mailboxId+categoryId+binnedAt+isDeleted]',
        '[mailboxId+categoryId+isStarred+isSender+binnedAt+isDeleted]',
        '[mailboxId+categoryId+tempId+isSender+binnedAt+isDeleted]',
        '[mailboxId+isRead+isSender+binnedAt+tempId+isDeleted]',

        'needsSync',
      ].join(','),

      // Keep other tables as they were
      draftEmails: 'id,mailboxId,[mailboxId+createdAt],[id+mailboxId],[mailboxId+deletedAt],updatedAt,[mailboxId+createdAt+isDeleted],[mailboxId+isDeleted],needsSync,[mailboxId+isDeleted+updatedAt]',
      mailboxes: 'id,createdAt',
      mailboxAliases: 'id,[mailboxId+alias],mailboxId,alias,default,[mailboxId+default],needsSync',
      mailboxCategories: 'id,[mailboxId+name],mailboxId,name,[mailboxId+isDeleted],needsSync',
      tempAliases: 'id,[mailboxId+alias],mailboxId,alias,expiresAt',
      user: 'id',
      passkeyCredentials: 'id,[userId+id],userId,id',
      userNotifications: 'id,[userId+id],userId,id',
      defaultDomains: 'id',
      mailboxForUser: '[userId+mailboxId],userId,mailboxId',
      mailboxTokens: 'id,[mailboxId+id],mailboxId,id',
      mailboxCustomDomains: 'id,[mailboxId+id],mailboxId,id',
      localSyncData: 'userId'
    });
  }

  /** check some indexdb tables and see if any changes need to be synced */
  async sync({ alreadyRefreshed = false }: { alreadyRefreshed?: boolean } = {}): Promise<{ error?: string } | undefined> {
    const localSyncData = await this.localSyncData.toArray();
    if (!localSyncData.length) return;

    if (isSyncing) {
      // wait 200ms and try again (prob better to not do double and instead do more batching)
      await new Promise(resolve => setTimeout(resolve, 200));
      return this.sync();
    };

    try {
      // this.localSyncData.update(localSyncData[0].userId, { isSyncing: true });
      isSyncing = true;
      const res = await syncLocal(localSyncData[0]);
      if (res === '401') {
        if (alreadyRefreshed) {
          return { error: 'Token expired' };
        }
        const r = await this.refreshToken();
        if (r?.error) {
          return { error: r.error };
        }
        return this.sync({ alreadyRefreshed: true });
      }
      await this.localSyncData.update(localSyncData[0].userId, { lastSync: new Date(), isSyncing: false });
      isSyncing = false;
      return
    } catch (error) {
      console.error('Failed to sync', error);
      return { error: error instanceof Error ? error.message : "failed to sync" };
    } finally {
      this.localSyncData.update(localSyncData[0].userId, { isSyncing: false });
      isSyncing = false;
    }
  }

  /** just check with server for outdated data */
  async fetchSync({ alreadyRefreshed = false }: { alreadyRefreshed?: boolean } = {}): Promise<{ error?: string } | undefined> {
    const localSyncData = await this.localSyncData.toArray();
    if (!localSyncData.length) return;
    if (isSyncing) {
      // wait 200ms and try again (prob better to not do double and instead do more batching)
      await new Promise(resolve => setTimeout(resolve, 200));
      return this.fetchSync();
    };

    try {
      this.localSyncData.update(localSyncData[0].userId, { isSyncing: true });
      isSyncing = true;
      const res = await fetchSync(localSyncData[0]);
      if (res === '401') {
        if (alreadyRefreshed) {
          return { error: 'Token expired' };
        }
        const r = await this.refreshToken();
        if (r?.error) {
          return { error: r.error };
        }
        return this.fetchSync({ alreadyRefreshed: true });
      }
      await this.localSyncData.update(localSyncData[0].userId, { lastSync: new Date(), isSyncing: false });
    } catch (error) {
      console.error('Failed to fetch sync', error);
    } finally {
      this.localSyncData.update(localSyncData[0].userId, { isSyncing: false });
      isSyncing = false;
    }
  }

  /** initial fetch of some data from server - more minor so */
  async initialFetchSync() {
    const localSyncData = await this.localSyncData.toArray();
    if (!localSyncData.length) return;

    try {
      await fetchSync({ minimal: true, ...localSyncData[0] });
    } catch (error) {
      console.error('Failed to initial fetch sync', error);
    }
  }

  async refreshToken() {
    const localSyncData = await this.localSyncData.toArray();
    if (!localSyncData.length) return;

    try {
      const data = await refreshToken(localSyncData[0].refreshToken, localSyncData[0].apiUrl);
      if (data === '401') {
        return { error: 'Token expired' };
      }
      await this.localSyncData.update(localSyncData[0].userId, { token: data.token, refreshToken: data.refreshToken, tokenExpiresAt: data.tokenExpiresAt });
    } catch (error) {
      console.error('Failed to refresh token', error);
    }
  }
}

let isSyncing = false;

export const db = new EmailDB();

// Initialize database
export async function initializeDB() {
  const v = localStorage.getItem("indexdb-test-version")
  if (v !== "v1.1b") {
    // delete the indexdb
    await asyncDeleteIndexDB("EmailDB");
    localStorage.setItem("indexdb-test-version", "v1.1b");
  }


  await db.open();
}


function asyncDeleteIndexDB(name: string) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onerror = reject;
    request.onsuccess = resolve;
  });
}
