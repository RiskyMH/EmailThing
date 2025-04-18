import db, { DefaultDomain, DraftEmail, Email, EmailAttachments, EmailRecipient, EmailSender, Mailbox, MailboxAlias, MailboxCategory, MailboxCustomDomain, MailboxForUser, MailboxTokens, PasskeyCredentials, User, UserNotification } from "@/db";
import { inArray, desc, and, gte, eq, type InferSelectModel, not, isNull, getTableColumns, sql, lte, or } from "drizzle-orm";
// import { hideToken } from "@/(email)/mail/[mailbox]/config/page";
import type { BatchItem } from "drizzle-orm/batch";
import { getSession, isValidOrigin } from "../tools";
import { deleteFile } from "@/utils/s3";

export function OPTIONS(request: Request) {
    const origin = request.headers.get("origin")
    if (!origin || !isValidOrigin(origin)) {
        return new Response("Not allowed", { status: 403 });
    }
    return new Response("OK", {
        headers: {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "authorization",
            "Access-Control-Allow-Credentials": "true",
        }
    });
}


export async function GET(request: Request) {
    const origin = request.headers.get("origin")
    if (!origin || !isValidOrigin(origin)) {
        return new Response("Not allowed", { status: 403 });
    }

    // a user can request a sync of their data to be storred in apps\pwa\src\utils\data\types.ts
    // this should give a list of objects that have been changed since the last sync
    // or if first time, give a reduced dataset - ie less emails and only a few tables


    // /api/internal/sync?last_sync=1715728000000
    // /api/internal/sync?minimal=true

    const { searchParams } = new URL(request.url);
    const lastSync = parseInt(searchParams.get("last_sync") || "0");
    const minimal = searchParams.get("minimal");

    const lastSyncDate = lastSync ? new Date(lastSync) : new Date(0);

    const currentUserid = await getSession(request);
    if (!currentUserid) return new Response("Unauthorized", {
        status: 401, headers: {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "authorization",
            "Access-Control-Allow-Credentials": "true",
        }
    });

    const [currentUser, mailboxesForUser] = await db.batch([
        db.query.User.findFirst({
            where: eq(User.id, currentUserid),
        }),
        db.query.MailboxForUser.findMany({
            where: and(eq(MailboxForUser.userId, currentUserid), eq(MailboxForUser.isDeleted, false)),
        }),
    ])

    if (!currentUser) return new Response("User not found", { status: 404 });

    if (minimal) {
        return Response.json(
            await getMinimalChanges(currentUser, mailboxesForUser),
            {
                headers: {
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "authorization",
                    "Access-Control-Allow-Credentials": "true",
                }
            }
        );
    }

    const newMailboxes = mailboxesForUser.filter(m => m.joinedAt > lastSyncDate).map(m => m.mailboxId)

    return Response.json(
        await getChanges(lastSyncDate, currentUser, mailboxesForUser, {}, newMailboxes),
        {
            headers: {
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "authorization",
                "Access-Control-Allow-Credentials": "true",
            }
        }
    );
}



export async function POST(request: Request) {
    const origin = request.headers.get("origin")
    if (!origin || !isValidOrigin(origin)) {
        return new Response("Not allowed", { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const lastSync = parseInt(searchParams.get("last_sync") || "0");
    const lastSyncDate = lastSync ? new Date(lastSync) : new Date();


    const currentUserid = await getSession(request);
    if (!currentUserid) return new Response("Unauthorized", {
        status: 401, headers: {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "authorization",
            "Access-Control-Allow-Credentials": "true",
        }
    });

    const [currentUser, mailboxesForUser] = await db.batch([
        db.query.User.findFirst({
            where: eq(User.id, currentUserid),
        }),
        db.query.MailboxForUser.findMany({
            where: and(eq(MailboxForUser.userId, currentUserid), eq(MailboxForUser.isDeleted, false)),
        }),
    ])

    if (!currentUser) return new Response("User not found", { status: 404 });

    // body is partial of ChangesResponse
    const body = await request.json() as ChangesRequest;
    // use the provided id (or null for create)
    // do some validations to ensure its safe
    // after that, update the database and return lastsynced object

    const errors: { key: string; id?: string | null; error: string; moreInfo?: string }[] = [];
    const changes = [] as BatchItem<"sqlite">[];

    for (const key in body) {
        if (key === "emails") {
            // update the emails
            // 1. verify user has access to the emails
            // 2. can update every field except for mailboxId and its own id
            // 2.1. if id is null, create it

            for (const email of body.emails || []) {
                if (!email) continue;
                if (!email.mailboxId || !mailboxesForUser.some((m) => m.mailboxId === email.mailboxId)) {
                    errors.push({
                        key: "emails",
                        id: email.id,
                        error: "User does not have access to the mailbox",
                        moreInfo: `Mailbox id: ${email.mailboxId}; User id: ${currentUser.id}`,
                    });
                    continue;
                }
                if (email.id == null) {
                    errors.push({
                        key: "emails",
                        id: null,
                        error: "Cannot create email yet",
                    });
                    continue;
                }
                // check that the emailid exists and is owned by the user
                const e = await db.select({ id: Email.id, size: Email.size }).from(Email).where(and(eq(Email.id, email.id), eq(Email.mailboxId, email.mailboxId)))
                if (!e.length) {
                    errors.push({
                        key: "emails",
                        id: email.id,
                        error: "Email not found",
                        moreInfo: `Email id: ${email.id}; Mailbox id: ${email.mailboxId}`,
                    });
                    continue;
                }

                if (email.hardDelete) {
                    const attachments = await db.query.EmailAttachments.findMany({
                        where: eq(EmailAttachments.emailId, email.id),
                        columns: {
                            id: true,
                            filename: true,
                        },
                    });

                    await Promise.all([
                        deleteFile(`${email.mailboxId}/${email.id}`),
                        deleteFile(`${email.mailboxId}/${email.id}/email.eml`),
                        ...attachments.map((attachment) =>
                            deleteFile(`${email.mailboxId}/${email.id}/${attachment.id}/${attachment.filename}`),
                        ),
                    ]);

                    // still not actually delete, but anonimise it
                    changes.push(
                        db.update(Email).set({
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
                        ),

                        db.delete(EmailSender).where(eq(EmailSender.emailId, email.id)),
                        db.delete(EmailRecipient).where(eq(EmailRecipient.emailId, email.id)),
                        db.delete(EmailAttachments).where(eq(EmailAttachments.emailId, email.id)),

                        db
                            .update(Mailbox)
                            .set({
                                storageUsed: sql`${Mailbox.storageUsed} - ${e[0].size}`,
                            })
                            .where(eq(Mailbox.id, email.mailboxId)),
                    )
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
                    errors.push({
                        key: "draftEmails",
                        id: draftEmail.id,
                        error: "User does not have access to the mailbox",
                    });
                    continue;
                }

                if (draftEmail.id == null) {
                    if (draftEmail.hardDelete) {
                        errors.push({
                            key: "draftEmails",
                            id: null,
                            error: "Cannot delete a non created draft email",
                        });
                        continue;
                    }
                } else if (draftEmail.id?.startsWith("new:")) {
                    if (draftEmail.hardDelete) {
                        errors.push({
                            key: "draftEmails",
                            id: null,
                            error: "Cannot delete a non created draft email",
                        });
                        continue;
                    }
                    // verify that there is no draft with this id
                    const e = await db.select({ id: DraftEmail.id, mailboxId: DraftEmail.mailboxId }).from(DraftEmail)
                        .where(eq(DraftEmail.id, draftEmail.id.replace("new:", "")))
                    if (e.length) {
                        if (e.length > 0 && !e.some((e) => e.mailboxId === draftEmail.mailboxId)) {
                            errors.push({
                                key: "draftEmails",
                                id: draftEmail.id,
                                error: "Draft email already exists",
                            });
                            draftEmail.id = null;
                        } else {
                            draftEmail.id = draftEmail.id.replace("new:", "");
                        }
                    }
                } else {
                    // check that the draftemailid exists and is owned by the user
                    const e = await db.select({ id: DraftEmail.id }).from(DraftEmail).where(and(eq(DraftEmail.id, draftEmail.id), eq(DraftEmail.mailboxId, draftEmail.mailboxId)))
                    if (!e.length) {
                        errors.push({
                            key: "draftEmails",
                            id: draftEmail.id,
                            error: "Draft email not found",
                        });
                        continue;
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
                    } else if (draftEmail.id.startsWith("new:")) {
                        changes.push(db.insert(DraftEmail).values({
                            id: draftEmail.id.replace("new:", ""),
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
                    errors.push({
                        key: "mailboxCategories",
                        id: mailboxCategory.id,
                        error: "User does not have access to the mailbox",
                    });
                    continue;
                }

                if (mailboxCategory.id?.startsWith("new:")) {
                    const e = await db.select({ id: MailboxCategory.id, mailboxId: MailboxCategory.mailboxId }).from(MailboxCategory).where(and(eq(MailboxCategory.id, mailboxCategory.id.replace("new:", "")), /*eq(MailboxCategory.mailboxId, mailboxCategory.mailboxId)*/))
                    if (e.length) {
                        if (e.length > 0 && !e.some((e) => e.mailboxId === mailboxCategory.mailboxId)) {
                            errors.push({
                                key: "mailboxCategories",
                                id: mailboxCategory.id,
                                error: "Mailbox category already exists",
                            });
                            mailboxCategory.id = null;
                        } else {
                            mailboxCategory.id = mailboxCategory.id.replace("new:", "");
                        }
                    }
                }
                else if (mailboxCategory.id !== null) {
                    const e = await db.select({ id: MailboxCategory.id }).from(MailboxCategory).where(and(eq(MailboxCategory.id, mailboxCategory.id), eq(MailboxCategory.mailboxId, mailboxCategory.mailboxId)))
                    if (!e.length) {
                        errors.push({
                            key: "mailboxCategories",
                            id: mailboxCategory.id,
                            error: "Mailbox category not found",
                        });
                        continue;
                    } 
                }

                const categoryColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

                if (mailboxCategory.color && !categoryColorRegex.test(mailboxCategory.color)) {
                    errors.push({
                        key: "mailboxCategories",
                        id: mailboxCategory.id,
                        error: "Invalid color for category",
                    });
                    continue;
                }

                if (mailboxCategory.hardDelete) {
                    if (!mailboxCategory.id || mailboxCategory.id.startsWith("new:")) {
                        errors.push({
                            key: "mailboxCategories",
                            id: mailboxCategory.id,
                            error: "Cannot delete a non created mailbox category",
                        });
                        continue;
                    }
                    changes.push(db.update(MailboxCategory).set({
                        isDeleted: true,
                        name: "<deleted>",
                        color: "<deleted>",
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    }).where(and(
                        eq(MailboxCategory.mailboxId, mailboxCategory.mailboxId),
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
                    } else if (mailboxCategory.id.startsWith("new:")) {
                        changes.push(db.insert(MailboxCategory).values({
                            id: mailboxCategory.id.replace("new:", ""),
                            mailboxId: mailboxCategory.mailboxId,
                            name: mailboxCategory.name,
                            color: mailboxCategory.color,
                        }))
                    } else {
                        changes.push(db.update(MailboxCategory).set({
                            name: mailboxCategory.name,
                            color: mailboxCategory.color,
                        }).where(and(
                            eq(MailboxCategory.mailboxId, mailboxCategory.mailboxId),
                            eq(MailboxCategory.id, mailboxCategory.id),
                            mailboxCategory.lastUpdated ? lte(MailboxCategory.updatedAt, new Date(mailboxCategory.lastUpdated)) : undefined
                        )))
                    }
                }
            }
        }

        else {
            errors.push({
                key: key,
                error: "Invalid key: " + key,
            });
        }
    }

    await db.batch(changes as any);

    const failedIds: Record<string, string[]> = {};
    for (const error of errors) {
        if (error.id) {
            if (!failedIds[error.key]) failedIds[error.key] = [];
            failedIds[error.key].push(error.id);
        }
    }

    const changesRes = await getChanges(lastSyncDate, currentUser, mailboxesForUser, failedIds)

    // if its a new and failed, add it to the changes as deleted
    for (const error of errors) {
        if (error.id?.startsWith("new:")) {
            // @ts-ignore
            changesRes[error.key].push({
                id: error.id.replace("new:", ""),
                isDeleted: true,
            } as any);
        }
    }

    // Return both errors and latest changes
    return Response.json({
        errors: errors.length > 0 ? errors : undefined,
        ...changesRes
    }, {
        headers: {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "authorization",
            "Access-Control-Allow-Credentials": "true",
        }
    });
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
    // /** //todo: */
    // mailboxTokens?: {}
    // /** //todo: */
    // mailboxCustomDomains?: {}
    // /** //todo: */
    // passkeyCredentials?: {}
    // userNotifications?: {
    //     /** null for create */
    //     id: null;
    //     userId: string;
    //     expiresAt?: Date;
    //     endpoint?: string | null;
    //     p256dh?: string | null;
    // }[];
    // /** //todo: */
    // mailboxesForUser?: {}
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
        emails: emails.map((e) => ({
            ...e,
            sender: emailSenders.find((s) => s.emailId === e.id),
            recipients: emailRecipients.filter((r) => r.emailId === e.id),
            attachments: emailAttachments.filter((a) => a.emailId === e.id),
        })),
        mailboxes,
        mailboxCategories,
        draftEmails,
        mailboxAliases,
    }
}

export type MinimalChangesResponse = Awaited<ReturnType<typeof getMinimalChanges>>
export type ChangesResponse = Awaited<ReturnType<typeof getChanges>>

async function getChanges(lastSyncDate: Date, currentUser: InferSelectModel<typeof User>, mailboxesForUser: InferSelectModel<typeof MailboxForUser>[], includeIds: Partial<Record<keyof ChangesRequest, string[]>> = {}, forceIncludeMailboxes: string[] = []) {
    const mailboxIds = mailboxesForUser.map((m) => m.mailboxId);
    const currentUserid = currentUser.id;

    const emails = await db.select().from(Email).where(and(
        inArray(Email.mailboxId, mailboxIds),
        or(
            gte(Email.updatedAt, lastSyncDate),
            includeIds.emails ? inArray(Email.id, includeIds.emails) : undefined,
            forceIncludeMailboxes ? inArray(Email.mailboxId, forceIncludeMailboxes) : undefined
        )
    )).limit(500)
    const emailIds = emails.filter((e) => !e.isDeleted).map((e) => e.id);

    const b = await db.batch([
        // get the email metadata
        db.select().from(EmailSender).where(inArray(EmailSender.emailId, emailIds)),
        db.select().from(EmailRecipient).where(inArray(EmailRecipient.emailId, emailIds)),
        db.select().from(EmailAttachments).where(inArray(EmailAttachments.emailId, emailIds)),

        db.select().from(Mailbox).where(inArray(Mailbox.id, mailboxIds)),
        db.select().from(MailboxCategory).where(and(
            inArray(MailboxCategory.mailboxId, mailboxIds),
            or(
                gte(MailboxCategory.updatedAt, lastSyncDate),
                includeIds.mailboxCategories ? inArray(MailboxCategory.id, includeIds.mailboxCategories) : undefined,
                forceIncludeMailboxes ? inArray(MailboxCategory.mailboxId, forceIncludeMailboxes) : undefined
            )
        )),
        db.select().from(MailboxAlias).where(and(
            inArray(MailboxAlias.mailboxId, mailboxIds),
            or(
                gte(MailboxAlias.updatedAt, lastSyncDate),
                includeIds.mailboxAliases ? inArray(MailboxAlias.id, includeIds.mailboxAliases) : undefined,
                forceIncludeMailboxes ? inArray(MailboxAlias.mailboxId, forceIncludeMailboxes) : undefined
            )
        )),
        // db.select().from(MailboxTokens).where(and(
        //     inArray(MailboxTokens.mailboxId, mailboxIds),
        //     or(
        //         gte(MailboxTokens.updatedAt, lastSyncDate),
        //         includeIds.mailboxTokens ? inArray(MailboxTokens.id, includeIds.mailboxTokens) : undefined,
        //         forceIncludeMailboxes ? inArray(MailboxTokens.mailboxId, forceIncludeMailboxes) : undefined
        //     )
        // )),
        db.select().from(MailboxCustomDomain).where(and(
            inArray(MailboxCustomDomain.mailboxId, mailboxIds),
            or(
                gte(MailboxCustomDomain.updatedAt, lastSyncDate),
                // includeIds.mailboxCustomDomains ? inArray(MailboxCustomDomain.id, includeIds.mailboxCustomDomains) : undefined,
                forceIncludeMailboxes ? inArray(MailboxCustomDomain.mailboxId, forceIncludeMailboxes) : undefined
            )
        )),
        db.select().from(DraftEmail).where(and(
            inArray(DraftEmail.mailboxId, mailboxIds),
            or(
                gte(DraftEmail.updatedAt, lastSyncDate),
                includeIds.draftEmails ? inArray(DraftEmail.id, includeIds.draftEmails) : undefined,
                forceIncludeMailboxes ? inArray(DraftEmail.mailboxId, forceIncludeMailboxes) : undefined
            )
        )).limit(500),

        db.select({
            ...getTableColumns(MailboxForUser),
            username: User.username,
        }).from(MailboxForUser).leftJoin(User, eq(MailboxForUser.userId, User.id)).where(and(
            inArray(MailboxForUser.mailboxId, mailboxIds),
            // not(eq(MailboxForUser.userId, currentUserid)),
            or(
                gte(MailboxForUser.updatedAt, lastSyncDate),
                gte(User.updatedAt, lastSyncDate),
                forceIncludeMailboxes ? inArray(MailboxForUser.mailboxId, forceIncludeMailboxes) : undefined,
            )
        )),

        // db.select().from(DefaultDomain).where(and(/*gte(DefaultDomain.updatedAt, lastSyncDate), */eq(DefaultDomain.available, true))),

        // db.select().from(PasskeyCredentials).where(and(eq(PasskeyCredentials.userId, currentUserid), gte(PasskeyCredentials.updatedAt, lastSyncDate))),
        // db.select().from(UserNotification).where(and(eq(UserNotification.userId, currentUserid), gte(UserNotification.createdAt, lastSyncDate))),
    ] as const)

    const [
        emailSenders,
        emailRecipients,
        emailAttachments,
        mailboxes,
        mailboxCategories,
        mailboxAliases,
        // mailboxTokens,
        mailboxCustomDomains,
        draftEmails,
        mailboxesForUser2,
        // defaultDomains,
        // passkeyCredentials,
        // userNotifications,
    ] = b;

    let getMoreEmails = emails.length >= 500;
    while (getMoreEmails) {
        // get the rest of emails - just in 500 chunks
        const restOfEmails = await db.select().from(Email).where(and(
            inArray(Email.mailboxId, mailboxIds),
            gte(Email.updatedAt, lastSyncDate),
            forceIncludeMailboxes ? inArray(Email.mailboxId, forceIncludeMailboxes) : undefined
        )).limit(500).offset(emails.length)
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
        const restOfDraftEmails = await db.select().from(DraftEmail).where(and(
            inArray(DraftEmail.mailboxId, mailboxIds),
            gte(DraftEmail.updatedAt, lastSyncDate),
            forceIncludeMailboxes ? inArray(DraftEmail.mailboxId, forceIncludeMailboxes) : undefined
        )).limit(500).offset(draftEmails.length)
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
            // ...mailboxesForUser.map((m) => ({
            //     ...m,
            //     username: currentUser.username,
            // })),
            ...mailboxesForUser2,
        ],
        emails: emails.map((e) => ({
            ...e,
            sender: emailSenders.find((s) => s.emailId === e.id),
            recipients: emailRecipients.filter((r) => r.emailId === e.id),
            attachments: emailAttachments.filter((a) => a.emailId === e.id),
        })),
        mailboxes,
        mailboxCategories,
        draftEmails,
        mailboxAliases,
        // mailboxTokens: mailboxTokens.map((t) => ({
        //     ...t,
        //     token: hideToken(t.token),
        // })),
        mailboxCustomDomains,
        // defaultDomains: defaultDomains.map((d) => ({
        //     ...d,
        //     authKey: undefined as never,
        // })),
        // passkeyCredentials: passkeyCredentials.map((p) => ({
        //     ...p,
        //     publicKey: undefined as never,
        // })),
        // userNotifications: userNotifications.map((u) => ({
        //     ...u,
        //     endpoint: undefined as never,
        //     p256dh: undefined as never,
        //     auth: undefined as never,
        // })),
    }
}

