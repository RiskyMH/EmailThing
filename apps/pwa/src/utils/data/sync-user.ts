import { db } from "@/utils/data/db";
import type { MinimalChangesResponse, ChangesResponse, ChangesRequest, ChangesResponseError } from "@/../../web/app/api/internal/sync/route";


export const getApiUrl = ({ lastSync, minimal, apiUrl }: { lastSync?: Date | 0, minimal?: boolean, apiUrl?: string }) => {
    const params = new URLSearchParams();
    if (lastSync) {
        params.append('last_sync', lastSync.getTime().toString());
    }
    if (minimal) {
        params.append('minimal', 'true');
    }
    return `${apiUrl ?? 'https://emailthing.app'}/api/internal/sync?${params.toString()}`
}


const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

// Parse values in the response data - convert nulls to 0
export const parseValues = (obj: any) => {
    if (!obj) return obj;
    for (const key of Object.keys(obj)) {
        // Handle date fields, excluding categoryId
        if ((key.toLowerCase().endsWith('at') || key.toLowerCase().includes('date')) && dateRegex.test(obj[key])) {
            obj[key] = new Date(obj[key]);
        }
        // Handle boolean fields
        else if (typeof obj[key] === 'boolean') {
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
    return arr?.filter(item => !item.isDeleted).map(parseValues) as T;
};

export async function parseSync(data: Partial<ChangesResponse>) {
    // Get tables that have data to process
    const tablesToProcess = Object.keys(data).filter(key => key === 'user' || data[key as keyof typeof data]?.length);
    const dbMap = {
        emails: db.emails,
        mailboxes: db.mailboxes,
        mailboxCategories: db.mailboxCategories,
        mailboxAliases: db.mailboxAliases,
        draftEmails: db.draftEmails,
        mailboxTokens: db.mailboxTokens,
        mailboxCustomDomains: db.mailboxCustomDomains,
        defaultDomains: db.defaultDomains,
        passkeyCredentials: db.passkeyCredentials,
        userNotifications: db.userNotifications,
        mailboxesForUser: db.mailboxForUser,
        user: db.user,
    } as const
    const dbTables = tablesToProcess.map(key => dbMap[key as keyof typeof dbMap]).filter(Boolean);

    await db.transaction('rw', dbTables, async () => {
        // Handle deletions first
        const deletions = tablesToProcess.map((key) => {
            const items = data[key as keyof typeof data];
            if (!items?.length) return null;

            const deletedItems = items.filter((item: any) => item.isDeleted);
            if (!deletedItems.length) return null;

            switch (key) {
                case 'mailboxesForUser':
                    return db.mailboxForUser?.bulkDelete(
                        deletedItems.map((m: any) => ([m.userId, m.mailboxId]))
                    );
                default:
                    return dbMap[key as keyof typeof data]?.bulkDelete(
                        deletedItems.map((item: any) => item.id)
                    );
            }
        }).filter(Boolean);

        // Handle updates/inserts
        const updates = tablesToProcess.map(key => {
            const items = data[key as keyof typeof data];
            if (!items) return null;

            switch (key) {
                case 'user':
                    return db.user.put(parseValues(items));
                default:
                    if (!items?.length) return null;
                    // @ts-ignore
                    return dbMap[key as keyof typeof data]?.bulkPut(parseValuesInArray(items));
            }
        }).filter(Boolean);

        const all = [...deletions, ...updates].filter(Boolean)
        if (all.length) {
            await Promise.all(all);
        }
    });

    return data;
}

async function getsLocalSyncData(): Promise<Partial<ChangesRequest>> {
    // use the needsSync field to get the data from the local db

    const emails = await db.emails.where('needsSync').equals(1).toArray()
    const draftEmails = await db.draftEmails.where('needsSync').equals(1).toArray()
    const mailboxCategories = await db.mailboxCategories.where('needsSync').equals(1).toArray()

    return {
        emails: emails.map(e => ({
            id: e.id,
            mailboxId: e.mailboxId,
            isStarred: e.isStarred === 1,
            isRead: e.isRead === 1,
            categoryId: e.categoryId || null,
            binnedAt: e.binnedAt || null,
            hardDelete: e.isDeleted === 1,
            lastUpdated: e.updatedAt === 0 ? null : e.updatedAt.toISOString() as any,
        })),
        draftEmails: draftEmails.map(e => ({
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
        mailboxCategories: mailboxCategories.map(c => ({
            id: !c.isNew ? c.id : `new:${c.id}`,
            mailboxId: c.mailboxId,
            name: c.name,
            color: c.color || null,
            hardDelete: c.isDeleted === 1,
            lastUpdated: c.updatedAt === 0 ? null : c.updatedAt.toISOString() as any,
        })),
    }
}


export async function syncLocal({ lastSync, token, apiUrl }: { lastSync?: Date, token?: string, apiUrl?: string }) {
    const payload = await getsLocalSyncData()
    if (!Object.keys(payload).length) return
    if (Object.values(payload).every(v => Array.isArray(v) ? v.length === 0 : v === null)) return

    const response = await fetch(getApiUrl({ lastSync, apiUrl }), {
        method: 'POST',
        headers: {
            "authorization": `${token}`
        },
        body: JSON.stringify(payload)
    })

    if (!response.ok) {
        console.error('Failed to sync user data', response);
        throw new Error('Failed to sync user data');
    }

    return parseSync(await response.json() as ChangesResponse)
}

export async function fetchSync({ lastSync, minimal, apiUrl, token }: { lastSync?: Date | 0, minimal?: boolean, apiUrl?: string, token?: string }) {
    const response = await fetch(getApiUrl({ lastSync, minimal, apiUrl }), {
        method: 'GET',
        headers: {
            "authorization": `${token}`
        }
    })

    if (!response.ok) {
        console.error('Failed to fetch sync data', response);
        throw new Error('Failed to fetch sync data');
    }

    return parseSync(await response.json() as (typeof minimal extends true ? MinimalChangesResponse : ChangesResponse))
}




