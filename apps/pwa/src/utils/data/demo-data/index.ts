import { db } from "../db";
import { demoEmails, demoSentEmails, demoTempEmails, demoDrafts } from "./emails";
import { demoMailbox, demoCategories, demoMailboxAliases } from "./mailbox";
import { demoDefaultDomains, demoMailboxCustomDomains, demoMailboxForUser, demoMailboxTokens, demoPasskeyCredentials, demoUserNotifications } from "./other";
import { demoUser } from "./other";
import { demoEmailRecipients } from "./recipients";
import { demoEmailSenders } from "./senders";
import { DEMO_DATA_VERSION, DEMO_VERSION_KEY, DemoDataVersion } from "./version";

async function getCurrentVersion(): Promise<number> {
    try {
        const version = await db.syncInfo.get(DEMO_VERSION_KEY);
        return version?.lastSynced.getTime() || 0;
    } catch (error) {
        console.error('Failed to get demo version:', error);
        return 0;
    }
}

async function updateVersion() {
    await db.syncInfo.put({
        id: DEMO_VERSION_KEY,
        lastSynced: new Date()
    });
}

export async function loadDemoData(force = 0) {
    try {
        const currentVersion = await getCurrentVersion();

        // Skip if already at latest version unless forced
        if (currentVersion === DEMO_DATA_VERSION && !force) {
            return;
        }

        await db.transaction('rw',
            [
                db.emails,
                db.emailSenders,
                db.emailRecipients,
                db.mailboxes,
                db.mailboxCategories,
                db.syncInfo,
                db.draftEmails,
                db.mailboxAliases,
                // db.mailboxTokens,
                // db.mailboxCustomDomains,
                // db.user,
                // db.passkeyCredentials,
                // db.userNotifications,
                // db.defaultDomains,
            ],
            async () => {
                // Clear existing demo data
                await Promise.all([
                    db.emails
                        .where('mailboxId')
                        .equals(demoMailbox.id)
                        .delete(),
                    db.emailSenders
                        .where('emailId')
                        .anyOf([...demoEmails, ...demoSentEmails, ...demoTempEmails].map(e => e.id))
                        .delete(),
                    db.emailRecipients
                        .where('emailId')
                        .anyOf([...demoEmails, ...demoSentEmails, ...demoTempEmails].map(e => e.id))
                        .delete(),
                    db.mailboxes
                        .where('id')
                        .equals(demoMailbox.id)
                        .delete(),
                    db.mailboxCategories
                        .where('mailboxId')
                        .equals(demoMailbox.id)
                        .delete(),
                    db.draftEmails
                        .where('mailboxId')
                        .equals(demoMailbox.id)
                        .delete(),
                    db.mailboxAliases
                        .where('mailboxId')
                        .equals(demoMailbox.id)
                        .delete(),
                ]);

                // Load new demo data
                await Promise.all([
                    db.mailboxes.add(demoMailbox),
                    db.mailboxCategories.bulkAdd(demoCategories),
                    db.emails.bulkAdd([...demoEmails, ...demoSentEmails, ...demoTempEmails]),
                    db.emailSenders.bulkAdd(demoEmailSenders),
                    db.emailRecipients.bulkAdd(demoEmailRecipients),
                    db.draftEmails.bulkAdd(demoDrafts),
                    db.mailboxAliases.bulkAdd(demoMailboxAliases),
                    // db.mailboxTokens.bulkAdd(demoMailboxTokens),
                    // db.mailboxCustomDomains.bulkAdd(demoMailboxCustomDomains),
                    // db.mailboxForUser.bulkAdd(demoMailboxForUser),
                    // db.user.add(demoUser),
                    // db.passkeyCredentials.bulkAdd(demoPasskeyCredentials),
                    // db.userNotifications.bulkAdd(demoUserNotifications),
                    // db.defaultDomains.bulkAdd(demoDefaultDomains),
                ]);

                // Update version
                await updateVersion();
            }
        );
    } catch (error) {
        console.error('Failed to load demo data:', error);
        throw error; // Re-throw to let caller handle it
    }
}

// Helper to check if we're using demo data
export async function isDemoMailbox(mailboxId: string): Promise<boolean> {
    return mailboxId === demoMailbox.id;
}
