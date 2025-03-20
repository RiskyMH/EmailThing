import { getUserByToken } from "@/utils/jwt";
import db, { DefaultDomain, DraftEmail, Email, EmailAttachments, EmailRecipient, EmailSender, Mailbox, MailboxAlias, MailboxCategory, MailboxCustomDomain, MailboxForUser, MailboxTokens, PasskeyCredentials, User, UserNotification } from "@/db";
import { inArray, desc, and, gte, eq, type InferSelectModel, not, isNull, getTableColumns, sql, lte } from "drizzle-orm";
import { hideToken } from "@/(email)/mail/[mailbox]/config/page";
import { cookies, headers } from "next/headers";
import type { BatchItem } from "drizzle-orm/batch";


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

    const { searchParams } = new URL(request.url);
    const lastSync = parseInt(searchParams.get("last_sync") || "0");
    const lastSyncDate = lastSync ? new Date(lastSync) : new Date();


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
    const body = await request.json() as ChangesRequest;
    // use the provided id (or null for create)
    // do some validations to ensure its safe
    // after that, update the database and return lastsynced object

    const changes = [] as BatchItem<"sqlite">[] // to bulk update at end

    for (const key in body) {
        if (key === "emails") {
            // update the emails
            // 1. verify user has access to the emails
            // 2. can update every field except for mailboxId and its own id
            // 2.1. if id is null, create it

            for (const email of body.emails || []) {

                if (!email) continue;
                if (!email.mailboxId || !mailboxesForUser.some((m) => m.mailboxId === email.mailboxId)) {
                    return Response.json({
                        error: "User does not have access to the mailbox",
                        moreInfo: `Mailbox id: ${email.mailboxId}; User id: ${currentUser.id} (access to ${mailboxesForUser.map((m) => m.mailboxId).join(", ")})`,
                    }, { status: 403 })
                }
                if (email.id == null) {
                    // normally create, but rn only update
                    return Response.json({
                        error: "Cannot create email yet",
                    }, { status: 400 })
                } else {
                    // check that the emailid exists and is owned by the user
                    const e = await db.select({ id: Email.id }).from(Email).where(and(eq(Email.id, email.id), eq(Email.mailboxId, email.mailboxId)))
                    if (!e) {
                        return Response.json({
                            error: "Email not found",
                            moreInfo: `Email id: ${email.id}; Mailbox id: ${email.mailboxId}; User id: ${currentUser.id}`,
                        }, { status: 404 })
                    }
                }

                if (email.hardDelete) {
                    // still not actually delete, but anonimise it
                    changes.push(db.update(Email).set({
                        isDeleted: true,
                        updatedAt: new Date(),
                        body: "<deleted>",
                        subject: "<deleted>",
                        binnedAt: null,
                        categoryId: null,
                        givenId: null,
                        givenReferences: null,
                        html: null,
                        isRead: true,
                        isSender: false,
                        replyTo: null,
                        snippet: null,
                        size: 0,
                        isStarred: false,
                        // tempId: null,
                        createdAt: new Date(),
                    }).where(and(
                        eq(Email.id, email.id),
                        eq(Email.mailboxId, email.mailboxId),
                        email.lastUpdated ? lte(Email.updatedAt, new Date(email.lastUpdated)) : undefined)
                    ))
                } else {
                    // update the email
                    changes.push(db.update(Email).set({
                        isStarred: email.isStarred,
                        isRead: email.isRead,
                        categoryId: email.categoryId,
                        binnedAt: email.binnedAt ? new Date() : email.binnedAt === null ? null : undefined,
                    }).where(and(
                        eq(Email.id, email.id),
                        eq(Email.mailboxId, email.mailboxId),
                        email.lastUpdated ? lte(Email.updatedAt, new Date(email.lastUpdated)) : undefined)
                    ))
                }


            }



        } else if (key === "draftEmails") {
            // update the draft emails
            // 1. verify user has access to the draft emails
            // 2. can update every field except for mailboxId and its own id
            // 2.1. if id is null, create it

            for (const draftEmail of body.draftEmails || []) {
                if (!draftEmail) continue;
                if (!draftEmail.mailboxId || !mailboxesForUser.some((m) => m.mailboxId === draftEmail.mailboxId)) {
                    return Response.json({
                        error: "User does not have access to the mailbox",
                    }, { status: 403 })
                }

                if (draftEmail.id == null) {
                    if (draftEmail.hardDelete) {
                        return Response.json({
                            error: "Cannot delete a non created draft email",
                        }, { status: 400 })
                    }
                } else {
                    // check that the draftemailid exists and is owned by the user
                    const e = await db.select({ id: DraftEmail.id }).from(DraftEmail).where(and(eq(DraftEmail.id, draftEmail.id), eq(DraftEmail.mailboxId, draftEmail.mailboxId)))
                    if (!e) {
                        return Response.json({
                            error: "Draft email not found",
                        }, { status: 404 })
                    }
                }

                if (draftEmail.hardDelete) {
                    // still not actually delete, but anonimise it
                    changes.push(db.update(DraftEmail).set({
                        isDeleted: true,
                        updatedAt: new Date(),
                        body: "<deleted>",
                        subject: "<deleted>",
                        from: null,
                        to: null,
                        headers: null,
                        createdAt: new Date(),
                    }).where(and(
                        eq(DraftEmail.id, draftEmail.id!),
                        eq(DraftEmail.mailboxId, draftEmail.mailboxId),
                        draftEmail.lastUpdated ? lte(DraftEmail.updatedAt, new Date(draftEmail.lastUpdated)) : undefined)
                    ))
                } else {

                    if (draftEmail.id == null) {
                        changes.push(db.insert(DraftEmail).values({
                            // id: draftEmail.id,
                            mailboxId: draftEmail.mailboxId,
                            body: draftEmail.body,
                            subject: draftEmail.subject,
                            from: draftEmail.from,
                            to: draftEmail.to,
                            headers: draftEmail.headers,
                        }))
                    } else {
                        // update the draft email
                        changes.push(db.update(DraftEmail).set({
                            body: draftEmail.body,
                            subject: draftEmail.subject,
                            from: draftEmail.from,
                            to: draftEmail.to,
                            headers: draftEmail.headers,
                        }).where(and(
                            eq(DraftEmail.id, draftEmail.id),
                            eq(DraftEmail.mailboxId, draftEmail.mailboxId),
                            draftEmail.lastUpdated ? lte(DraftEmail.updatedAt, new Date(draftEmail.lastUpdated)) : undefined)
                        ))
                    }
                }



            }


        } else if (key === "mailboxCategories") {
            // update the mailbox categories
            // 1. verify user has access to the mailbox categories
            // 2. can update name/color
            // 2.1. if id is null, create it

            for (const mailboxCategory of body.mailboxCategories || []) {
                if (!mailboxCategory) continue;
                if (!mailboxCategory.mailboxId || !mailboxesForUser.some((m) => m.mailboxId === mailboxCategory.mailboxId)) {
                    return Response.json({
                        error: "User does not have access to the mailbox",
                    }, { status: 403 })
                }
                const categoryColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

                if (mailboxCategory.color && !categoryColorRegex.test(mailboxCategory.color)) {
                    return Response.json({
                        error: "Invalid color for category",
                    }, { status: 400 })
                }

                if (mailboxCategory.hardDelete) {
                    if (!mailboxCategory.id) {
                        return Response.json({
                            error: "Cannot delete a non created mailbox category",
                        }, { status: 400 })
                    }
                    changes.push(db.update(MailboxCategory).set({
                        isDeleted: true,
                        name: "<deleted>",
                        color: "<deleted>",
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    }).where(and(
                        eq(MailboxCategory.id, mailboxCategory.id),
                        mailboxCategory.lastUpdated ? lte(MailboxCategory.updatedAt, new Date(mailboxCategory.lastUpdated)) : undefined
                    )))
                } else {
                    if (mailboxCategory.id == null) {
                        changes.push(db.insert(MailboxCategory).values({
                            mailboxId: mailboxCategory.mailboxId,
                            name: mailboxCategory.name,
                            color: mailboxCategory.color,
                        }))
                    } else {
                        changes.push(db.update(MailboxCategory).set({
                            name: mailboxCategory.name,
                            color: mailboxCategory.color,
                        }).where(and(
                            eq(MailboxCategory.id, mailboxCategory.id),
                            mailboxCategory.lastUpdated ? lte(MailboxCategory.updatedAt, new Date(mailboxCategory.lastUpdated)) : undefined
                        )))
                    }

                }
            }
        }

        else {
            return Response.json({
                error: "Invalid key: " + key,
            }, { status: 400 })
        }
    }

    await db.batch(changes as any);

    return Response.json(await getChanges(lastSyncDate, currentUser, mailboxesForUser));

}


type DateString = `${number}-${number}-${number}T${number}:${number}:${number}.${number}Z`
export type ChangesRequest = {
    emails?: {
        id: string;
        mailboxId: string;
        isStarred?: boolean;
        isRead?: boolean;
        categoryId?: string | null;
        binnedAt?: Date | null;
        hardDelete?: boolean;
        lastUpdated?: DateString;
    }[];
    draftEmails?: {
        /** null for create */
        id: string | null;
        mailboxId: string;
        body?: string | null;
        subject?: string | null;
        from?: string | null;
        to?: {
            name: string | null;
            address: string;
            cc?: "cc" | "bcc" | null;
        }[] | null;
        headers?: { key: string; value: string }[];
        hardDelete?: boolean;
        lastUpdated?: DateString;
    }[];
    mailboxCategories?: {
        /** null for create */
        id: string | null;
        mailboxId: string;
        name: string;
        color?: string | null;
        hardDelete?: boolean;
        lastUpdated?: DateString;
    }[];
    /** //todo: */
    mailboxAliases?: {}
    /** //todo: */
    mailboxTokens?: {}
    /** //todo: */
    mailboxCustomDomains?: {}
    /** //todo: */
    passkeyCredentials?: {}
    userNotifications?: {
        /** null for create */
        id: null;
        userId: string;
        expiresAt?: Date;
        endpoint?: string | null;
        p256dh?: string | null;
    }[];
    /** //todo: */
    mailboxesForUser?: {}
}

export type ChangesResponseError = {
    error: string;
    moreInfo?: string;
}




async function getMinimalChanges(currentUser: InferSelectModel<typeof User>, mailboxesForUser: InferSelectModel<typeof MailboxForUser>[]) {
    const mailboxIds = mailboxesForUser.map((m) => m.mailboxId);
    const currentUserid = currentUser.id;

    const emails = await db.select({
        ...getTableColumns(Email),
        html: sql`NULL`,
    }).from(Email)
        .where(inArray(Email.mailboxId, mailboxIds))
        .orderBy(desc(Email.createdAt)).limit(50);
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
            .orderBy(desc(DraftEmail.createdAt)).limit(50),
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
    const mailboxIds = mailboxesForUser.map((m) => m.mailboxId);
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
