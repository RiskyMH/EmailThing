import Dexie, { type Table } from "dexie";
import { fetchSync, refreshToken, syncLocal } from "./sync-user";
import type {
  DBEmail,
  DBEmailDraft,
  DBMailbox,
  DBMailboxAlias,
  DBMailboxCategory,
  DBMailboxCustomDomain,
  DBMailboxForUser,
  DBTempAlias,
  DBUser,
  LocalSyncData,
  ApiCustomisations,
} from "./types";

export class EmailDB extends Dexie {
  // Tables
  emails!: Table<DBEmail, string>;
  draftEmails!: Table<DBEmailDraft, string>;
  mailboxes!: Table<DBMailbox, string>;
  mailboxAliases!: Table<DBMailboxAlias, string>;
  mailboxCategories!: Table<DBMailboxCategory, string>;
  tempAliases!: Table<DBTempAlias, string>;
  mailboxCustomDomains!: Table<DBMailboxCustomDomain, string>;
  user!: Table<DBUser, string>;
  mailboxForUser!: Table<DBMailboxForUser, string>;
  localSyncData!: Table<LocalSyncData, string>;
  apiCustomisations!: Table<ApiCustomisations, string>;

  constructor() {
    super("EmailDB");

    this.version(1).stores({
      // Add comprehensive indexes for emails
      emails: [
        // Primary key
        "id",
        // Basic indexes
        "mailboxId",
        "categoryId",
        "isRead",
        "isStarred",
        "isSender",
        "binnedAt",
        "tempId",
        "createdAt",

        "[id+mailboxId]",
        "[mailboxId+createdAt]",
        "[mailboxId+isDeleted]",
        "[mailboxId+createdAt+deletedAt+isDeleted]",
        "[mailboxId+isDeleted+createdAt]",

        "[mailboxId+categoryId+isSender+binnedAt+tempId+isDeleted+createdAt]",
        "[mailboxId+isSender+binnedAt+tempId+isDeleted+createdAt]",
        "[mailboxId+categoryId+binnedAt+tempId+isDeleted+createdAt]",
        "[mailboxId+binnedAt+tempId+isDeleted+createdAt]",
        "[mailboxId+categoryId+isStarred+isSender+binnedAt+tempId+isDeleted+createdAt]",
        "[mailboxId+isStarred+isSender+binnedAt+tempId+isDeleted+createdAt]",
        "[mailboxId+categoryId+tempId+isSender+binnedAt+isDeleted+createdAt]",
        "[mailboxId+tempId+isSender+binnedAt+isDeleted+createdAt]",

        "[mailboxId+isSender+binnedAt+tempId+isDeleted]",
        "[mailboxId+binnedAt+tempId+isDeleted]",
        "[mailboxId+isStarred+isSender+binnedAt+tempId+isDeleted]",
        "[mailboxId+categoryId+isSender+binnedAt+tempId+isDeleted]",
        "[mailboxId+categoryId+binnedAt+isDeleted]",
        "[mailboxId+categoryId+isStarred+isSender+binnedAt+isDeleted]",
        "[mailboxId+categoryId+tempId+isSender+binnedAt+isDeleted]",
        "[mailboxId+isRead+isSender+binnedAt+tempId+isDeleted]",

        "needsSync",
      ].join(","),

      // Keep other tables as they were
      draftEmails:
        "id,mailboxId,[mailboxId+createdAt],[id+mailboxId],[mailboxId+deletedAt],updatedAt,[mailboxId+createdAt+isDeleted],[mailboxId+isDeleted],needsSync,[mailboxId+isDeleted+updatedAt]",
      mailboxes: "id,createdAt",
      mailboxAliases: "id,[mailboxId+alias],mailboxId,alias,default,[mailboxId+default],needsSync",
      mailboxCategories: "id,[mailboxId+name],mailboxId,name,[mailboxId+isDeleted],needsSync",
      tempAliases: "id,[mailboxId+alias],mailboxId,alias,expiresAt,[mailboxId+isDeleted]",
      user: "id",
      // passkeyCredentials: 'id,[userId+id],userId,id',
      // userNotifications: 'id,[userId+id],userId,id',
      // defaultDomains: 'id',
      mailboxForUser: "[userId+mailboxId],userId,mailboxId",
      // mailboxTokens: 'id,[mailboxId+id],mailboxId,id',
      mailboxCustomDomains: "id,[mailboxId+id],mailboxId,id",
      localSyncData: "userId",
      apiCustomisations: "apiUrl",
    });
  }

  /** check some indexdb tables and see if any changes need to be synced */
  async sync({
    alreadyRefreshed = false,
  }: { alreadyRefreshed?: boolean } = {}): Promise<{ error?: string } | undefined> {
    const localSyncData = await this.localSyncData.toArray();
    if (!localSyncData.length) return;

    if (isSyncing) {
      // wait 200ms and try again (prob better to not do double and instead do more batching)
      await new Promise((resolve) => setTimeout(resolve, 200));
      return this.sync();
    }

    try {
      // this.localSyncData.update(localSyncData[0].userId, { isSyncing: true });
      isSyncing = true;

      const res = await syncLocal(localSyncData[0]);
      if (res === "401") {
        if (alreadyRefreshed) {
          return { error: "Token expired" };
        }
        const r = await this.refreshToken();
        if (r?.error) {
          return { error: r.error };
        }
        return this.sync({ alreadyRefreshed: true });
      }

      if (res?.time) {
        const lastSync = new Date(new Date(res.time).getTime() - 60000);
        await this.localSyncData.update(localSyncData[0].userId, { lastSync, isSyncing: false });
      }
      // else {
      //   await this.localSyncData.update(localSyncData[0].userId, { /*lastSync*/, isSyncing: false });
      // }
      isSyncing = false;
      return;
    } catch (error) {
      console.error("Failed to sync", error);
      return { error: error instanceof Error ? error.message : "failed to sync" };
    } finally {
      this.localSyncData.update(localSyncData[0].userId, { isSyncing: false });
      isSyncing = false;
    }
  }

  /** just check with server for outdated data */
  async fetchSync({
    alreadyRefreshed = false,
  }: { alreadyRefreshed?: boolean } = {}): Promise<{ error?: string } | undefined> {
    const localSyncDatas = await this.localSyncData.toArray();
    if (!localSyncDatas.length) return;
    if (isSyncing) {
      // wait 200ms and try again (prob better to not do double and instead do more batching)
      await new Promise((resolve) => setTimeout(resolve, 200));
      return this.fetchSync();
    }

    for (const localSyncData of localSyncDatas) {
      try {
        this.localSyncData.update(localSyncData.userId, { isSyncing: true });
        isSyncing = true;

        const res = await fetchSync(localSyncData);
        if (res === "401") {
          if (alreadyRefreshed) {
            return { error: "Token expired" };
          }
          const r = await this.refreshToken();
          if (r?.error) {
            return { error: r.error };
          }
          return this.fetchSync({ alreadyRefreshed: true });
        }

        if (res?.time) {
          const lastSync = new Date(new Date(res.time).getTime() - 60000);
          await this.localSyncData.update(localSyncData.userId, { lastSync, isSyncing: false });
        }
        //  else {
        //   await this.localSyncData.update(localSyncData[0].userId, { /*lastSync*/, isSyncing: false });
        // }
      } catch (error) {
        console.error("Failed to fetch sync", error);
      } finally {
        this.localSyncData.update(localSyncData.userId, { isSyncing: false });
        isSyncing = false;
      }
    }
  }

  /** initial fetch of some data from server - more minor so */
  async initialFetchSync() {
    const localSyncDatas = await this.localSyncData.toArray();
    if (!localSyncDatas.length) return;

    try {
      for (const localSyncData of localSyncDatas) {
        await fetchSync({ minimal: true, ...localSyncData });
      }
    } catch (error) {
      console.error("Failed to initial fetch sync", error);
    }
  }

  async refreshToken() {
    const localSyncDatas = await this.localSyncData.toArray();
    if (!localSyncDatas.length) return;

    try {
      for (const localSyncData of localSyncDatas) {
        const data = await refreshToken(localSyncData.refreshToken, localSyncData.apiUrl);
        if (data === "401") {
          return { error: "Token expired" };
        }
        await this.localSyncData.update(localSyncData.userId, data);
      }
    } catch (error) {
      console.error("Failed to refresh token", error);
    }
  }

  async logout(userId?: string) {
    let localSyncData = await this.localSyncData.toArray();
    if (userId) {
      localSyncData = localSyncData.filter((data) => data.userId === userId);
    }
    localSyncData.map(async (data) => {
      return fetch(`${data.apiUrl}/api/internal/revoke-token`, {
        method: "DELETE",
        headers: {
          // logically it doesn't matter if its a session or refresh token
          // but refresh lasts longer and there shouldnt be any cases where refresh is invalid but token is
          Authorization: `refresh ${data.refreshToken}`,
        },
      });
    });

    const tables = [
      this.emails,
      this.draftEmails,
      this.mailboxes,
      this.mailboxAliases,
      this.mailboxCategories,
      // this.mailboxTokens,
      this.mailboxCustomDomains,
      // this.defaultDomains,
      // this.passkeyCredentials,
      // this.userNotifications,
      this.mailboxForUser,
      this.user,
      this.localSyncData,
      this.apiCustomisations,
    ] as const;
    await this.transaction("rw", tables, () => Promise.all(tables.map((table) => table.clear())));
    sessionStorage.removeItem("demo");
  }
}

let isSyncing = false;

export const db = new EmailDB();

// Initialize database
const forceIndexDBKey = "indexdb-test-version";
const forceIndexDBVersion = "v1.1c";

export async function initializeDB() {
  const v = localStorage.getItem(forceIndexDBKey);
  if (v === undefined) {
    localStorage.setItem(forceIndexDBKey, forceIndexDBVersion);
  } else if (v !== forceIndexDBVersion) {
    await asyncDeleteIndexDB("EmailDB");
    localStorage.setItem(forceIndexDBKey, forceIndexDBVersion);
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
