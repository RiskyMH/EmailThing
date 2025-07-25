import type {
  ChangesRequest,
  ChangesResponse,
  MinimalChangesResponse,
} from "@/../../web/app/api/internal/sync/route";
import { db } from "@/utils/data/db";
import { API_URL } from "@emailthing/const/urls";

export const getApiUrl = ({
  lastSync,
  minimal,
  apiUrl,
}: { lastSync?: Date | 0; minimal?: boolean; apiUrl?: string }) => {
  const params = new URLSearchParams();
  if (lastSync) {
    // params.append("last_sync", lastSync.getTime().toString());
    params.set("last_sync_", "");
  }
  if (minimal) {
    params.append("minimal", "true");
  }
  return `${apiUrl ?? API_URL}/api/internal/sync?${params.toString()}`;
};

const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

// Parse values in the response data - convert nulls to 0
export const parseValues = (obj: any) => {
  if (!obj) return obj;
  for (const key of Object.keys(obj)) {
    // Handle date fields, excluding categoryId
    if (
      (key.toLowerCase().endsWith("at") || key.toLowerCase().includes("date")) &&
      dateRegex.test(obj[key])
    ) {
      obj[key] = new Date(obj[key]);
    }
    // Handle boolean fields
    else if (typeof obj[key] === "boolean") {
      obj[key] = obj[key] ? 1 : 0;
    }
    // Handle all other fields
    else {
      obj[key] = obj[key] ?? 0;
    }
  }
  obj.needsSync = 0;
  return obj;
};

// Parse values in arrays and filter out deleted items
export const parseValuesInArray = <T extends any[]>(arr: T) => {
  return arr?.filter((item) => !item.isDeleted).map(parseValues) as T;
};

export async function parseSync(data: Partial<ChangesResponse & { time: string }>, userId: string) {
  // Get tables that have data to process
  const tablesToProcess = Object.keys(data).filter(
    (key) => key === "user" || key === "apiCustomisations" || data[key as keyof typeof data]?.length,
  );
  const dbMap = {
    emails: db.emails,
    mailboxes: db.mailboxes,
    mailboxCategories: db.mailboxCategories,
    mailboxAliases: db.mailboxAliases,
    tempAliases: db.tempAliases,
    draftEmails: db.draftEmails,
    // mailboxTokens: db.mailboxTokens,
    mailboxCustomDomains: db.mailboxCustomDomains,
    // defaultDomains: db.defaultDomains,
    // passkeyCredentials: db.passkeyCredentials,
    // userNotifications: db.userNotifications,
    mailboxesForUser: db.mailboxForUser,
    user: db.user,
    apiCustomisations: db.apiCustomisations,
  } as const;
  const dbTables = tablesToProcess.map((key) => dbMap[key as keyof typeof dbMap]).filter(Boolean);
  if (!dbTables.length) return data;

  await db.transaction("rw", Object.values(dbMap).filter(Boolean), async () => {
    // Handle deletions first
    const deletions = tablesToProcess
      .map((_key) => {
        if (_key === "time") return null;
        const key = _key as keyof Omit<typeof data, "time">;
        const items = data[key];
        if (!items?.length) return null;

        if (!Array.isArray(items)) return null;

        const deletedItems = items.filter?.((item: any) => item.isDeleted);
        if (!deletedItems?.length) return null;

        switch (key) {
          case "mailboxesForUser": {
            const mailboxTables = [
              db.emails,
              db.mailboxes,
              db.mailboxCategories,
              db.mailboxAliases,
              db.draftEmails,
              // db.mailboxTokens,
              db.mailboxCustomDomains,
            ] as const;
            const mailboxIds = deletedItems.filter((m: any) => m.userId === userId).map((m: any) => m.mailboxId);
            return Promise.all([
              db.mailboxForUser?.bulkDelete(
                // @ts-expect-error this *should* work
                deletedItems.map((m) => [m.userId, m.mailboxId]),
              ),
              // todo: for multi user support, we should just remove the key itself (ie above code)
              // and then check if any more users have access to that mailboxId
              // if so, then dont delete data with that mailboxId, otherwise delete it
              db.mailboxForUser.where("mailboxId").anyOf(...mailboxIds).delete(),
              ...mailboxTables.map((table) =>
                table === db.mailboxes
                  ? db.mailboxes.where("id").anyOf(...mailboxIds).delete()
                  : table.where("mailboxId").anyOf(...mailboxIds).delete(),
              ),
            ]);
          }

          default:
            return dbMap[key]?.bulkDelete(deletedItems.map((item: any) => item.id));
        }
      })
      .filter(Boolean);

    // Handle updates/inserts
    const updates = tablesToProcess
      .map((key) => {
        const items = data[key as keyof typeof data];
        if (!items) return null;

        switch (key) {
          case "user":
            return db.user.put(parseValues(items));
          case "apiCustomisations":
            return db.apiCustomisations.put(items);
          default:
            if (!items?.length) return null;
            // @ts-ignore
            return dbMap[key as keyof typeof data]?.bulkPut(parseValuesInArray(items));
        }
      })
      .filter(Boolean);

    const all = [...deletions, ...updates].filter(Boolean);
    if (all.length) {
      await Promise.all(all);
    }
  });

  return data;
}

async function getsLocalSyncData(): Promise<Partial<ChangesRequest>> {
  // use the needsSync field to get the data from the local db

  const emails = await db.emails.where("needsSync").equals(1).toArray();
  const draftEmails = await db.draftEmails.where("needsSync").equals(1).toArray();
  const mailboxCategories = await db.mailboxCategories.where("needsSync").equals(1).toArray();

  return {
    emails: emails
      .filter((e) => e.mailboxId !== "demo")
      .map((e) => ({
        id: e.id,
        mailboxId: e.mailboxId,
        isStarred: e.isStarred === 1,
        isRead: e.isRead === 1,
        categoryId: e.categoryId || null,
        binnedAt: e.binnedAt || null,
        hardDelete: e.isDeleted === 1,
        lastUpdated: e.updatedAt === 0 ? null : (e.updatedAt.toISOString() as any),
      })),
    draftEmails: draftEmails
      .filter((e) => e.mailboxId !== "demo")
      .map((e) => ({
        id: !e.isNew ? e.id : `new:${e.id}`,
        mailboxId: e.mailboxId,
        body: e.body || null,
        subject: e.subject || null,
        from: e.from || null,
        to: e.to || [],
        headers: e.headers || [],
        hardDelete: e.isDeleted === 1,
        lastUpdated: e.updatedAt.toISOString() as any,
      })),
    mailboxCategories: mailboxCategories
      .filter((e) => e.mailboxId !== "demo")
      .map((c) => ({
        id: !c.isNew ? c.id : `new:${c.id}`,
        mailboxId: c.mailboxId,
        name: c.name,
        color: c.color || null,
        hardDelete: c.isDeleted === 1,
        lastUpdated: c.updatedAt === 0 ? null : (c.updatedAt.toISOString() as any),
      })),
  };
}

export async function syncLocal({
  lastSync,
  token,
  apiUrl,
  userId,
}: { lastSync?: Date | 0; token?: string; apiUrl?: string, userId: string }) {
  const payload = await getsLocalSyncData();
  if (!Object.keys(payload).length) return;
  if (Object.values(payload).every((v) => (Array.isArray(v) ? v.length === 0 : v === null))) return;

  const response = await fetch(getApiUrl({ lastSync, apiUrl }), {
    method: "POST",
    headers: {
      authorization: `session ${token}`,
      "x-last-sync": lastSync ? (lastSync.getTime() + 1).toString() : undefined,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.status === 401) {
      console.warn("Token expired, refreshing...");
      return "401";
    }
    console.error("Failed to sync user data", response);
    throw new Error("Failed to sync user data");
  }

  return parseSync((await response.json()) as ChangesResponse, userId);
}

export async function fetchSync({
  lastSync,
  minimal,
  apiUrl,
  token,
  userId,
}: { lastSync?: Date | 0; minimal?: boolean; apiUrl?: string; token?: string, userId: string }) {
  const response = await fetch(getApiUrl({ lastSync, minimal, apiUrl }), {
    method: "GET",
    headers: {
      authorization: `session ${token}`,
      "x-last-sync": lastSync ? (lastSync.getTime() + 1).toString() : undefined,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      console.warn("Token expired, refreshing...");
      return "401";
    }
    console.error("Failed to fetch sync data", response);
    throw new Error("Failed to fetch sync data");
  }

  return parseSync(
    (await response.json()) as typeof minimal extends true
    ? MinimalChangesResponse
    : ChangesResponse,
    userId,
  );
}

export async function refreshToken(refreshToken: string, apiUrl?: string) {
  const response = await fetch(`${apiUrl || "https://emailthing.app"}/api/internal/refresh-token`, {
    method: "POST",
    headers: {
      authorization: `refresh ${refreshToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      console.warn("Token expired, must relogin");
      return "401";
    }
    console.error("Failed to refresh token", response);
    throw new Error("Failed to refresh token");
  }

  const data = (await response.json()) as {
    token: string;
    refreshToken: string;
    tokenExpiresAt: Date;
  };

  return data;
}
