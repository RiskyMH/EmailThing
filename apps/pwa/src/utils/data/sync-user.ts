import { db } from "@/utils/data/db";
import type { MinimalChangesResponse, ChangesResponse, ChangesRequest, ChangesResponseError } from "@/../../web/app/api/internal/sync/route";


export async function syncUser(minimal = false, lastSync?: Date) {
    if (!localStorage.getItem('token')) return false

    // Build query params
    const params = new URLSearchParams();
    if (minimal) {
        params.append('minimal', 'true');
    }
    if (lastSync) {
        params.append('last_sync', lastSync.getTime().toString());
    }

    // Call sync API
    const response = await fetch(`https://emailthing.app/api/internal/sync?${params.toString()}`, {
        headers: {
            "x-auth": `${localStorage.getItem('token')}`
        }
    });
    if (!response.ok) {
        console.error('Failed to sync user data', response);
        throw new Error('Failed to sync user data');
    }

    return parseSyncResponse(response, minimal);
}

type NeedsToSyncStore = ChangesRequest

export async function proposeSync(changes?: ChangesRequest, lastSync?: Date) {
    try {
        const now = new Date()

        const store: NeedsToSyncStore = JSON.parse(localStorage?.getItem('sync-user') ?? '{}')
        // update the _store with current changes
        for (const key of Object.keys(changes ?? {}) as (keyof ChangesRequest)[]) {
            store[key] ??= []
            if (Array.isArray(store[key])) {
                store[key].push(...(changes?.[key] ?? []))
            } else {
                store[key] = {
                    ...store[key],
                    ...(changes?.[key] ?? {})
                }
            }
        }
        // save the _store
        localStorage.setItem('sync-user', JSON.stringify(store))

        if (JSON.stringify(store) === "{}") return { data: null, errors: ["No changes to sync"] }

        const isSyncing = localStorage.getItem('is-syncing')
        // if syncing, wait 100ms and try again
        if (isSyncing && new Date(isSyncing).getTime() > Date.now() - 100) {
            console.log('waiting for another sync to finish')
            await new Promise(resolve => setTimeout(resolve, 100))
            return proposeSync({}, lastSync)
        }
        localStorage.setItem('is-syncing', new Date().toISOString())


        if (!localStorage.getItem('token')) return { data: null, errors: ["You are not logged in"] }

        // Build query params
        const params = new URLSearchParams();
        if (lastSync) {
            params.append('last_sync', lastSync.getTime().toString());
        }

        // Call sync API
        const response = await fetch(`https://emailthing.app/api/internal/sync?${params.toString()}`, {
            method: 'POST',
            headers: {
                "x-auth": `${localStorage.getItem('token')}`
            },
            body: JSON.stringify(store)
        });
        if (!response.ok) {
            console.error('Failed to sync user data', response);
            if (response.body) {
                const e = await response.json() as ChangesResponseError
                return { data: null, errors: [e.error] }
            }
            return { data: null, errors: ["Unknown error. Can you connect to the internet?"] }
        }

        try {
            const d = { data: await parseSyncResponse(response), errors: null };

            const _store = JSON.parse(JSON.stringify(store || "{}")) as NeedsToSyncStore

            // save the _store minus the changes done here
            for (const key of Object.keys(store) as (keyof NeedsToSyncStore)[]) {
                const _key = _store[key]
                const _changes = changes?.[key]
                if (Array.isArray(_key) && Array.isArray(_changes)) {
                    _store[key] = _key.filter((item: any) => !_changes?.some(change => change.id === item.id))
                } else {
                    if (store[key]) {
                        delete _store[key]
                    }
                }
            }
            localStorage.setItem('sync-user', JSON.stringify(_store))
            localStorage.removeItem('is-syncing')

            if (lastSync) {
                localStorage.setItem('last-sync', now.toISOString())
            }

            return d

        } catch (e) {
            console.error('Failed to parse sync response', e);
            return { data: null, errors: e instanceof Error ? e.message : "Unknown error. Can you connect to the internet?" }
        } finally {
        }

    } catch (e) {
        console.error('Failed to propose sync', e);
        return { data: null, errors: e instanceof Error ? e.message : "Unknown error. Can you connect to the internet?" }
    }
}


async function parseSyncResponse(response: Response, minimal = false) {
    // Parse response
    const data = await response.json() as (typeof minimal extends true ? MinimalChangesResponse : ChangesResponse);

    // Parse values in the response data - convert nulls to 0
    const parseValues = (obj: any) => {
        if (!obj) return obj;
        for (const key of Object.keys(obj)) {
            // Handle date fields, excluding categoryId
            if ((key.toLowerCase().includes('at') || key.toLowerCase().includes('date')) && !key.endsWith('Id')) {
                obj[key] = obj[key] ? new Date(obj[key]) : 0;
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
        return obj;
    };

    // Parse values in arrays and filter out deleted items
    const parseValuesInArray = <T extends any[]>(arr: T) => {
        return arr?.filter(item => !item.isDeleted).map(parseValues) as T;
    };

    await db.transaction('rw', [
        db.emails,
        db.emailSenders,
        db.emailRecipients,
        db.emailAttachments,
        db.mailboxes,
        db.mailboxCategories,
        db.mailboxAliases,
        db.draftEmails,
        db.mailboxTokens,
        db.mailboxCustomDomains,
        db.defaultDomains,
        db.passkeyCredentials,
        db.userNotifications,
        db.mailboxForUser,
        db.user,
    ], async () => {
        // Handle deletions first
        const emailIds = data.emails?.filter((e: any) => e.isDeleted)?.map((e: any) => e.id) ?? [];
        await Promise.all([
            // Delete emails and related data
            db.emails.bulkDelete(emailIds),
            db.emailSenders.where('emailId').anyOf(emailIds).delete(),
            db.emailRecipients.where('emailId').anyOf(emailIds).delete(),
            db.emailAttachments.where('emailId').anyOf(emailIds).delete(),

            // Delete other entities
            db.mailboxes.bulkDelete(data.mailboxes?.filter((m: any) => m.isDeleted)?.map((m: any) => m.id) ?? []),
            db.mailboxCategories.bulkDelete(data.mailboxCategories?.filter((c: any) => c.isDeleted)?.map((c: any) => c.id) ?? []),
            db.mailboxAliases.bulkDelete(data.mailboxAliases?.filter((a: any) => a.isDeleted)?.map((a: any) => a.id) ?? []),
            db.draftEmails.bulkDelete(data.draftEmails?.filter((d: any) => d.isDeleted)?.map((d: any) => d.id) ?? []),
            db.mailboxTokens.bulkDelete(data.mailboxTokens?.filter((t: any) => t.isDeleted)?.map((t: any) => t.id) ?? []),
            db.mailboxCustomDomains.bulkDelete(data.mailboxCustomDomains?.filter((d: any) => d.isDeleted)?.map((d: any) => d.id) ?? []),
            db.defaultDomains.bulkDelete(data.defaultDomains?.filter((d: any) => d.isDeleted)?.map((d: any) => d.id) ?? []),
            db.passkeyCredentials.bulkDelete(data.passkeyCredentials?.filter((c: any) => c.isDeleted)?.map((c: any) => c.id) ?? []),
            db.userNotifications.bulkDelete(data.userNotifications?.filter((n: any) => n.isDeleted)?.map((n: any) => n.id) ?? []),
            // @ts-expect-error - this *should* work
            db.mailboxForUser.bulkDelete(data.mailboxesForUser?.filter((m: any) => m.isDeleted)?.map((m: any) => ([m.userId, m.mailboxId])) ?? []),
        ]);

        // Then handle updates/inserts
        await Promise.all([
            // User data
            db.user.put(parseValues(data.user)),
            db.mailboxForUser.bulkPut(parseValuesInArray(data.mailboxesForUser)),

            // Email data
            db.emails.bulkPut(parseValuesInArray(data.emails)),
            db.emailSenders.bulkPut(parseValuesInArray(data.emailSenders)),
            db.emailRecipients.bulkPut(parseValuesInArray(data.emailRecipients)),
            db.emailAttachments.bulkPut(parseValuesInArray(data.emailAttachments)),

            // Mailbox data
            db.mailboxes.bulkPut(parseValuesInArray(data.mailboxes)),
            db.mailboxCategories.bulkPut(parseValuesInArray(data.mailboxCategories)),
            db.mailboxAliases.bulkPut(parseValuesInArray(data.mailboxAliases)),
            db.draftEmails.bulkPut(parseValuesInArray(data.draftEmails)),

            // Additional data if full sync
            ...(!minimal ? [
                db.mailboxTokens.bulkPut(parseValuesInArray(data.mailboxTokens)),
                db.mailboxCustomDomains.bulkPut(parseValuesInArray(data.mailboxCustomDomains)),
                db.defaultDomains.bulkPut(parseValuesInArray(data.defaultDomains)),
                db.passkeyCredentials.bulkPut(parseValuesInArray(data.passkeyCredentials)),
                db.userNotifications.bulkPut(parseValuesInArray(data.userNotifications)),
            ] : [])
        ]);
    });

    return data;
}
