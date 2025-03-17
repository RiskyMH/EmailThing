import { db } from "@/utils/data/db";
import type { MinimalChangesResponse, ChangesResponse } from "@/../../web/app/api/internal/sync/route";

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

    db.transaction('rw', [
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
        db.userNotifications
    ], async () => {
        // Handle deletions first
        await Promise.all([
            // Delete emails and related data
            ...(data.emails?.filter((e: any) => e.isDeleted)?.map((e: any) => e.id) ?? []).length > 0 ? [
                async () => {
                    const emailIds = data.emails?.filter((e: any) => e.isDeleted)?.map((e: any) => e.id) ?? [];
                    await Promise.all([
                        db.emails.bulkDelete(emailIds),
                        db.emailSenders.where('emailId').anyOf(emailIds).delete(),
                        db.emailRecipients.where('emailId').anyOf(emailIds).delete(),
                        db.emailAttachments.where('emailId').anyOf(emailIds).delete()
                    ]);
                }
            ] : [],

            // Delete other entities
            db.mailboxes.bulkDelete(data.mailboxes?.filter((m: any) => m.isDeleted)?.map((m: any) => m.id) ?? []),
            db.mailboxCategories.bulkDelete(data.mailboxCategories?.filter((c: any) => c.isDeleted)?.map((c: any) => c.id) ?? []),
            db.mailboxAliases.bulkDelete(data.mailboxAliases?.filter((a: any) => a.isDeleted)?.map((a: any) => a.id) ?? []),
            db.draftEmails.bulkDelete(data.draftEmails?.filter((d: any) => d.isDeleted)?.map((d: any) => d.id) ?? [])
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
                db.userNotifications.bulkPut(parseValuesInArray(data.userNotifications))
            ] : [])
        ]);
    });

    return data;
}
