import { getUserByToken } from "@/utils/jwt";
import db, { DefaultDomain, DraftEmail, Email, EmailAttachments, EmailRecipient, EmailSender, Mailbox, MailboxAlias, MailboxCategory, MailboxCustomDomain, MailboxForUser, MailboxTokens, PasskeyCredentials, User, UserNotification } from "@/db";
import { inArray, desc, and, gte, eq, type InferSelectModel, not, isNull } from "drizzle-orm";
import { hideToken } from "@/(email)/mail/[mailbox]/config/page";
import { cookies, headers } from "next/headers";


const getCurrentUser = async () => {
    const token = (await cookies()).get("token")?.value || (await headers()).get("x-auth");
    if (!token) return null;
    try {
        return await getUserByToken(token);
    } catch (e) {
        return null;
    }
};


export async function GET(request: Request) {
    // a user can request a sync of their data to be storred in apps\pwa\src\utils\data\types.ts
    // this should give a list of objects that have been changed since the last sync
    // or if first time, give a reduced dataset - ie less emails and only a few tables


    // /api/internal/sync?last_sync=1715728000000
    // /api/internal/sync?minimal=true

    const { searchParams } = new URL(request.url);
    const lastSync = parseInt(searchParams.get("last_sync") || "0");
    const minimal = searchParams.get("minimal");

    const lastSyncDate = lastSync ? new Date(lastSync) : new Date(0);

    console.log({ lastSyncDate, minimal, lastSync });

    const currentUserid = await getCurrentUser();
    if (!currentUserid) return new Response("Unauthorized", { status: 401 });

    const currentUser = await db.query.User.findFirst({
        where: eq(User.id, currentUserid),
    });
    if (!currentUser) return new Response("User not found", { status: 404 });

    // get all mailboxes for this user
    const mailboxesForUser = await db.query.MailboxForUser.findMany({
        where: eq(MailboxForUser.userId, currentUser.id),
    });

    if (minimal) {
        return Response.json(await getMinimalChanges(currentUser, mailboxesForUser));
    }

    return Response.json(await getChanges(lastSyncDate, currentUser, mailboxesForUser));
}



export async function POST(request: Request) {
    const currentUserid = await getCurrentUser();
    if (!currentUserid) return new Response("Unauthorized", { status: 401 });

    const currentUser = await db.query.User.findFirst({
        where: eq(User.id, currentUserid),
    });
    if (!currentUser) return new Response("User not found", { status: 404 });

    const mailboxesForUser = await db.query.MailboxForUser.findMany({
        where: eq(MailboxForUser.userId, currentUser.id),
    });

    // body is partial of ChangesResponse
    const body = await request.json() as Partial<ChangesRequest>;
    // use the provided id (or null for create)
    // do some validations to ensure its safe
    // after that, update the database and return lastsynced object

    // TODO
    return Response.json({
        TODO: "TODO",
    }, { status: 200 })

}

export type ChangesRequest = Pick<Awaited<ReturnType<typeof getChanges>>,
    "emails" | // only actions like if starred, trashed, etc
    "draftEmails" | // can create, update, delete
    "mailboxCategories" | // can create, update, delete
    "mailboxAliases" | // only delete or change name (not the actual alias)
    "mailboxTokens" | // only delete
    "mailboxCustomDomains" | // only delete
    "passkeyCredentials" | // only delete or create
    "userNotifications" | // only delete or create
    "mailboxesForUser"  // only delete (ie leave a mailbox)

// the rest of items will have to be done in seperate api calls that are more targeted
>




async function getMinimalChanges(currentUser: InferSelectModel<typeof User>, mailboxesForUser: InferSelectModel<typeof MailboxForUser>[]) {
    const mailboxIds = mailboxesForUser.map((m) => m.mailboxId);
    const currentUserid = currentUser.id;

    const emails = await db.select().from(Email)
        .where(inArray(Email.mailboxId, mailboxIds))
        .orderBy(desc(Email.createdAt)).limit(100);
    const emailIds = emails.filter((e) => !e.isDeleted).map((e) => e.id);

    const b = await db.batch([
        // get the email metadata
        db.select().from(EmailSender).where(inArray(EmailSender.emailId, emailIds)),
        db.select().from(EmailRecipient).where(inArray(EmailRecipient.emailId, emailIds)),
        db.select().from(EmailAttachments).where(inArray(EmailAttachments.emailId, emailIds)),

        db.select().from(Mailbox).where(inArray(Mailbox.id, mailboxIds)),
        db.select().from(MailboxCategory).where(inArray(MailboxCategory.mailboxId, mailboxIds)),
        db.select().from(MailboxAlias).where(inArray(MailboxAlias.mailboxId, mailboxIds)),
        db.select().from(DraftEmail).where(inArray(DraftEmail.mailboxId, mailboxIds))
            .orderBy(desc(DraftEmail.createdAt)).limit(100),
    ] as const)

    const [emailSenders, emailRecipients, emailAttachments, mailboxes, mailboxCategories, mailboxAliases, draftEmails] = b;

    return {
        user: {
            ...currentUser,
            password: undefined as never,
        } as Omit<Partial<typeof currentUser>, "password">,
        mailboxesForUser,
        emails,
        emailSenders,
        emailRecipients,
        emailAttachments,
        mailboxes,
        mailboxCategories,
        draftEmails,
        mailboxAliases,
    }
}

export type MinimalChangesResponse = Awaited<ReturnType<typeof getMinimalChanges>>
export type ChangesResponse = Awaited<ReturnType<typeof getChanges>>

async function getChanges(lastSyncDate: Date, currentUser: InferSelectModel<typeof User>, mailboxesForUser: InferSelectModel<typeof MailboxForUser>[]) {
    const mailboxIds = [mailboxesForUser.map((m) => m.mailboxId)[0]];
    const currentUserid = currentUser.id;

    const emails = await db.select().from(Email).where(and(inArray(Email.mailboxId, mailboxIds), gte(Email.updatedAt, lastSyncDate))).limit(500)
    const emailIds = emails.filter((e) => !e.isDeleted).map((e) => e.id);

    const b = await db.batch([
        // get the email metadata
        db.select().from(EmailSender).where(inArray(EmailSender.emailId, emailIds)),
        db.select().from(EmailRecipient).where(inArray(EmailRecipient.emailId, emailIds)),
        db.select().from(EmailAttachments).where(inArray(EmailAttachments.emailId, emailIds)),

        db.select().from(Mailbox).where(inArray(Mailbox.id, mailboxIds)),
        db.select().from(MailboxCategory).where(and(inArray(MailboxCategory.mailboxId, mailboxIds), gte(MailboxCategory.updatedAt, lastSyncDate))),
        db.select().from(MailboxAlias).where(and(inArray(MailboxAlias.mailboxId, mailboxIds), gte(MailboxAlias.updatedAt, lastSyncDate))),
        db.select().from(MailboxTokens).where(and(inArray(MailboxTokens.mailboxId, mailboxIds), gte(MailboxTokens.updatedAt, lastSyncDate))),
        db.select().from(MailboxCustomDomain).where(and(inArray(MailboxCustomDomain.mailboxId, mailboxIds), gte(MailboxCustomDomain.updatedAt, lastSyncDate))),
        db.select().from(DraftEmail).where(and(inArray(DraftEmail.mailboxId, mailboxIds), gte(DraftEmail.updatedAt, lastSyncDate))).limit(500),
        db.select().from(MailboxForUser).where(and(inArray(MailboxForUser.mailboxId, mailboxIds), not(eq(MailboxForUser.userId, currentUserid)), gte(MailboxForUser.updatedAt, lastSyncDate))),

        db.select().from(DefaultDomain).where(and(/*gte(DefaultDomain.updatedAt, lastSyncDate), */eq(DefaultDomain.available, true))),

        db.select().from(PasskeyCredentials).where(and(eq(PasskeyCredentials.userId, currentUserid), gte(PasskeyCredentials.updatedAt, lastSyncDate))),
        db.select().from(UserNotification).where(and(eq(UserNotification.userId, currentUserid), gte(UserNotification.createdAt, lastSyncDate))),
    ] as const)

    const [
        emailSenders,
        emailRecipients,
        emailAttachments,
        mailboxes,
        mailboxCategories,
        mailboxAliases,
        mailboxTokens,
        mailboxCustomDomains,
        draftEmails,
        mailboxesForUser2,
        defaultDomains,
        passkeyCredentials,
        userNotifications,
    ] = b;

    let getMoreEmails = emails.length >= 500;
    while (getMoreEmails) {
        // get the rest of emails - just in 500 chunks
        const restOfEmails = await db.select().from(Email).where(and(inArray(Email.mailboxId, mailboxIds), gte(Email.updatedAt, lastSyncDate))).limit(500).offset(emails.length)
        const [emailSenders2, emailRecipients2, emailAttachments2] = await db.batch([
            db.select().from(EmailSender).where(inArray(EmailSender.emailId, restOfEmails.map((e) => e.id))),
            db.select().from(EmailRecipient).where(inArray(EmailRecipient.emailId, restOfEmails.map((e) => e.id))),
            db.select().from(EmailAttachments).where(inArray(EmailAttachments.emailId, restOfEmails.map((e) => e.id))),
        ])
        emailSenders.push.apply(emailSenders, emailSenders2);
        emailRecipients.push.apply(emailRecipients, emailRecipients2);
        emailAttachments.push.apply(emailAttachments, emailAttachments2);
        emails.push.apply(emails, restOfEmails);

        if (restOfEmails.length < 500) {
            getMoreEmails = false;
        }
    }

    let getMoreDraftEmails = draftEmails.length >= 500;
    while (getMoreDraftEmails) {
        const restOfDraftEmails = await db.select().from(DraftEmail).where(and(inArray(DraftEmail.mailboxId, mailboxIds), gte(DraftEmail.updatedAt, lastSyncDate))).limit(500).offset(draftEmails.length)
        draftEmails.push.apply(draftEmails, restOfDraftEmails);
        if (restOfDraftEmails.length < 500) {
            getMoreDraftEmails = false;
        }
    }

    // anonomyse user pwd, token, passkey publickey, notitification endpoint and p256dh

    return {
        user: {
            ...currentUser,
            password: undefined as never,
        } as Omit<Partial<typeof currentUser>, "password">,
        mailboxesForUser: [
            ...mailboxesForUser,
            ...mailboxesForUser2,
        ],
        emails,
        emailSenders,
        emailRecipients,
        emailAttachments,
        mailboxes,
        mailboxCategories,
        draftEmails,
        mailboxAliases,
        mailboxTokens: mailboxTokens.map((t) => ({
            ...t,
            token: hideToken(t.token),
        })),
        mailboxCustomDomains,
        defaultDomains: defaultDomains.map((d) => ({
            ...d,
            authKey: undefined as never,
        })),
        passkeyCredentials: passkeyCredentials.map((p) => ({
            ...p,
            publicKey: undefined as never,
        })),
        userNotifications: userNotifications.map((u) => ({
            ...u,
            endpoint: undefined as never,
            p256dh: undefined as never,
            auth: undefined as never,
        })),
    }
}
