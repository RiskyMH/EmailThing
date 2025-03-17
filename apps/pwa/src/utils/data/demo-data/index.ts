import { db } from "../db";
import { demoEmails, demoSentEmails, demoTempEmails, demoDrafts } from "./emails";
import { demoMailbox, demoCategories, demoMailboxAliases } from "./mailbox";
import { demoEmailRecipients } from "./recipients";
import { demoEmailSenders } from "./senders";


export async function loadDemoData(force = 0) {
    try {
        await db.transaction('rw',
            [
                db.emails,
                db.emailSenders,
                db.emailRecipients,
                db.mailboxes,
                db.mailboxCategories,
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
