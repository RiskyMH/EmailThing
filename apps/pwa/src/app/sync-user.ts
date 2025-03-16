import { db } from "@/utils/data/db";
import type { MinimalChangesResponse, ChangesResponse } from "@/../../web/app/api/internal/sync/route";

export async function syncUser(minimal = false, lastSync?: Date) {
    if (!localStorage.getItem('token')) return false

    // const _response = await fetch(`http://localhost:3000/api/internal/add-cookie?token=${localStorage.getItem('token')}`);
    // if (!_response.ok) {
    //     console.error('Failed to add cookie', _response);
    //     throw new Error('Failed to add cookie');
    // }

    // Build query params
    const params = new URLSearchParams();
    if (minimal) {
        params.append('minimal', 'true');
    }
    if (lastSync) {
        params.append('last_sync', lastSync.getTime().toString());
    }

    // Call sync API
    const response = await fetch(`http://localhost:3000/api/internal/sync?${params.toString()}`, {
        headers: {
            "x-auth": `${localStorage.getItem('token')}`
        }
    });
    if (!response.ok) {
        console.error('Failed to sync user data', response);
        throw new Error('Failed to sync user data');
    }

    // Parse response
    const data = await response.json() as (typeof minimal extends true ? MinimalChangesResponse : ChangesResponse);

    // Parse dates in the response data
    const parseDate = (obj: any) => {
        if (!obj) return obj;
        for (const key of Object.keys(obj)) {
            if (key.toLowerCase().includes('at') || key.toLowerCase().includes('date')) {
                obj[key] = obj[key] ? new Date(obj[key]) : null;
            }
        }
        return obj;
    };

    // Parse dates in arrays
    const parseDatesInArray = (arr: any[]) => arr?.map(parseDate) ?? [];

    // Bulk upsert all data into IndexedDB with parsed dates
    await Promise.all([
        // User data
        db.user.put(parseDate(data.user)),
        db.mailboxForUser.bulkPut(parseDatesInArray(data.mailboxesForUser)),

        // Email data
        db.bulkUpsertEmails(parseDatesInArray(data.emails)),
        db.bulkUpsertSenders(parseDatesInArray(data.emailSenders)),
        db.bulkUpsertRecipients(parseDatesInArray(data.emailRecipients)),
        db.bulkUpsertAttachments(parseDatesInArray(data.emailAttachments)),

        // Mailbox data
        db.mailboxes.bulkPut(parseDatesInArray(data.mailboxes)),
        db.mailboxCategories.bulkPut(parseDatesInArray(data.mailboxCategories)),
        db.mailboxAliases.bulkPut(parseDatesInArray(data.mailboxAliases)),
        db.draftEmails.bulkPut(parseDatesInArray(data.draftEmails)),

        // Additional data if full sync
        ...(!minimal ? [
            db.mailboxTokens.bulkPut(parseDatesInArray(data.mailboxTokens)),
            db.mailboxCustomDomains.bulkPut(parseDatesInArray(data.mailboxCustomDomains)),
            db.defaultDomains.bulkPut(parseDatesInArray(data.defaultDomains)),
            db.passkeyCredentials.bulkPut(parseDatesInArray(data.passkeyCredentials)),
            db.userNotifications.bulkPut(parseDatesInArray(data.userNotifications))
        ] : [])
    ]);

    return data;
}
