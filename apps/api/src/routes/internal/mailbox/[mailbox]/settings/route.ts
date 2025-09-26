import { getSession, isValidOrigin } from "@/routes/internal/tools";
import { db, MailboxForUser, TempAlias } from "@/db";
import { and, eq, gte, or, getTableColumns, type InferSelectModel } from "drizzle-orm";
// import { revalidateTag } from "next/cache";
import {
    DefaultDomain,
    Mailbox,
    MailboxAlias,
    MailboxCategory,
    MailboxCustomDomain,
    MailboxTokens,
    User,
} from "@/db";
import { aliasLimit, customDomainLimit, mailboxUsersLimit } from "@emailthing/const/limits";
import { generateToken } from "@/utils/token";
import { emailSchema } from "@/utils/validations/auth";
import { impersonatingEmails } from "@/utils/validations/invalid-emails";
import { count, like, not, sql } from "drizzle-orm";
import { createId, init } from "@paralleldrive/cuid2";
import { TEMP_EMAIL_EXPIRES_IN } from "@emailthing/const/expiry";

const createSmallId = init({ length: 7 });

export async function POST(request: Request, { params }: { params: Promise<{ mailbox: string }> }) {
    const origin = request.headers.get("origin");
    if (!origin || !isValidOrigin(origin)) {
        return new Response("Not allowed", { status: 403 });
    }

    const headers = {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization,content-type",
        "Access-Control-Allow-Credentials": "false",
        "Access-Control-Max-Age": "3600",
    };

    // Get mailbox ID from URL
    const { mailbox: mailboxId } = (await params) || (request as any).params;

    // Get type from search param
    const type = new URL(request.url).searchParams.get("type") as keyof MappedPossibleData | null;
    if (!type) return Response.json({ message: { error: "Missing type parameter" } }, { status: 400, headers });
    const date = new Date();

    const currentUserId = await getSession(request);
    if (!currentUserId) return Response.json({ message: { error: "Unauthorized" } }, { status: 401, headers });

    const [mailbox, userAccess] = await db.batchFetch([
        db.query.Mailbox.findFirst({
            where: eq(Mailbox.id, mailboxId),
            columns: {
                id: true,
            },
        }),
        db.query.MailboxForUser.findFirst({
            where: and(eq(MailboxForUser.mailboxId, mailboxId), eq(MailboxForUser.userId, currentUserId), eq(MailboxForUser.isDeleted, false)),
        }),
    ]);

    if (!mailbox || !userAccess) return Response.json({ message: { error: "Access denied to mailbox" } }, { status: 403, headers });


    const data = await request.json();

    const results = {
        "verify-domain": verifyDomain,
        "add-alias": addAlias,
        "edit-alias": editAlias,
        "change-default-alias": changeDefaultAlias,
        "delete-alias": deleteAlias,
        "delete-custom-domain": deleteCustomDomain,
        "make-token": makeToken,
        "delete-token": deleteToken,
        "add-user": addUserToMailbox.bind(null, userAccess.role),
        "remove-user": removeUserFromMailbox.bind(null, userAccess.role),
        "create-temp-alias": createTempAlias,
    } as const;


    try {
        const result = await results[type as keyof typeof results](mailboxId, data);
        if (!result) return new Response("Not allowed", { status: 403 });
    
        if ("error" in result) return Response.json({ message: result }, { status: 400, headers });

        const sync = await db.batchFetch([
            db.query.Mailbox.findFirst({
                where: eq(Mailbox.id, mailboxId),
            }),
            db.query.MailboxAlias.findMany({
                where: and(eq(MailboxAlias.mailboxId, mailboxId), gte(MailboxAlias.updatedAt, date)),
            }),
            db.query.MailboxCustomDomain.findMany({
                where: and(eq(MailboxCustomDomain.mailboxId, mailboxId), gte(MailboxCustomDomain.updatedAt, date)),
            }),
            db.query.MailboxCategory.findMany({
                where: and(eq(MailboxCategory.mailboxId, mailboxId), gte(MailboxCategory.updatedAt, date)),
            }),
            db.query.TempAlias.findMany({
                where: and(eq(TempAlias.mailboxId, mailboxId), gte(TempAlias.updatedAt, date)),
            }),
            db.select({
                ...getTableColumns(MailboxForUser),
                username: User.username,
            })
                .from(MailboxForUser)
                .leftJoin(User, eq(MailboxForUser.userId, User.id))
                .where(
                    and(
                        eq(MailboxForUser.mailboxId, mailboxId),
                        // not(eq(MailboxForUser.userId, currentUserid)),
                        or(
                            gte(MailboxForUser.updatedAt, date),
                            gte(User.updatedAt, date),
                        ),
                    ),
                ),
        ]);

        return Response.json({ 
            message: result, 
            sync: {
                mailboxes: sync[0] ? [sync[0]] : [],
                mailboxAliases: sync[1],
                mailboxCustomDomains: sync[2],
                mailboxCategories: sync[3],
                tempAliases: sync[4],
                mailboxesForUser: sync[5],
            } 
        } satisfies MappedPossibleDataResponse, { status: 200, headers });
    } catch (error) {
        console.error("Error in mailbox settings:", error);
        return Response.json({ message: { error: "An error occurred" } }, { status: 500, headers });
    }
}

export function OPTIONS(request: Request) {
    const origin = request.headers.get("origin");
    if (!origin || !isValidOrigin(origin)) {
        return new Response("Not allowed", { status: 403 });
    }

    return new Response("OK", {
        headers: {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "authorization,content-type",
            "Access-Control-Allow-Credentials": "false",
            "Access-Control-Max-Age": "3600",
        },
    });
}


export type PossibleData =
    | VerifyDomainData
    | AddAliasData
    | EditAliasData
    | ChangeDefaultAliasData
    | DeleteAliasData
    | DeleteCustomDomainData
    | MakeTokenData
    | DeleteTokenData
    | AddUserData
    | RemoveUserData
    | CreateTempAliasData

export type MappedPossibleData = {
    "verify-domain": VerifyDomainData;
    "add-alias": AddAliasData;
    "edit-alias": EditAliasData;
    "change-default-alias": ChangeDefaultAliasData;
    "delete-alias": DeleteAliasData;
    "delete-custom-domain": DeleteCustomDomainData;
    "make-token": MakeTokenData;
    "delete-token": DeleteTokenData;
    "add-user": AddUserData;
    "remove-user": RemoveUserData;
    "create-temp-alias": CreateTempAliasData;
}

export type MappedPossibleDataResponse =
    | {
        message: {
            success: string;
            description?: string;
            /** only returned for `makeToken` */
            token?: string;
        };
        sync: {
            mailboxes: InferSelectModel<typeof Mailbox>[];
            mailboxAliases: InferSelectModel<typeof MailboxAlias>[];
            mailboxCustomDomains: InferSelectModel<typeof MailboxCustomDomain>[];
            mailboxCategories: InferSelectModel<typeof MailboxCategory>[];
            tempAliases: InferSelectModel<typeof TempAlias>[];
            mailboxesForUser: InferSelectModel<typeof MailboxForUser>[];
        };
    }
    | {
        message: {
            error: string;
        };
    };



export interface VerifyDomainData {
    customDomain: string;
}
async function verifyDomain(mailboxId: string, data: VerifyDomainData) {
    const { customDomain } = data;

    // check if mailbox plan allows for more than 1 custom domain
    const [mailbox, customDomains, exists] = await db.batchFetch([
        db.query.Mailbox.findFirst({
            where: eq(Mailbox.id, mailboxId),
            columns: {
                plan: true,
            },
        }),

        db
            .select({ count: count() })
            .from(MailboxCustomDomain)
            .where(and(eq(MailboxCustomDomain.mailboxId, mailboxId), eq(MailboxCustomDomain.isDeleted, false))),

        db.query.MailboxCustomDomain.findFirst({
            where: and(
                eq(sql`lower(${MailboxCustomDomain.domain})`, sql`lower(${customDomain})`),
                eq(MailboxCustomDomain.mailboxId, mailboxId),
                eq(MailboxCustomDomain.isDeleted, false),
            ),
            columns: {
                id: true,
            },
        }),
    ]);

    if (!mailbox) {
        throw new Error("Mailbox not found");
    }

    if (customDomainLimit[mailbox.plan] <= customDomains[0].count) {
        return { error: "Custom domain limit reached" };
    }

    if (!customDomain) {
        return { error: "Custom domain not found" }
    }

    if (exists) {
        // return { error: "You have already verified this domain" }
        return { success: "Domain already verified" }
    }

    // verify domain by checking txt records on _emailthing.<domain> and check if one of the txt records has their mailbox id
    // use 1.1.1.1 doh api
    const res = await fetch(
        `https://cloudflare-dns.com/dns-query?name=_emailthing.${encodeURIComponent(customDomain)}&type=TXT`,
        {
            headers: {
                accept: "application/dns-json",
            },
            cache: "no-cache",
        },
    );

    const json = await res.json();

    if (json.Status !== 0) {
        return { error: "Failed to verify domain" };
    }

    const txtRecords = json?.Answer?.filter((a: any) => a.type === 16) || [];

    if (txtRecords.length === 0) {
        return { error: "No txt records found" };
    }

    const verified = txtRecords.some((r: any) => r.data.includes(`mailbox=${mailboxId}`));

    if (!verified) {
        return { error: "Domain not verified" };
    }

    // make domain
    await db
        .insert(MailboxCustomDomain)
        .values({
            domain: customDomain,
            mailboxId,
        })
        .execute();

    return { success: "Domain verified" }
}

export interface AddAliasData {
    alias: string;
    name: string | null;
}
async function addAlias(mailboxId: string, data: AddAliasData) {
    const { alias, name } = data;

    // check emailSchema
    const validEmail = emailSchema.safeParse({ email: alias });
    if (!validEmail.success) {
        return { error: validEmail.error.errors[0].message };
    }

    // check if alias exists
    const existingAlias = await db.query.MailboxAlias.findFirst({
        // intentionally not checking if it's deleted, as we don't want people to get already used aliases
        where: eq(sql`lower(${MailboxAlias.alias})`, sql`lower(${alias})`),
        columns: {
            id: true,
        },
    });

    if (existingAlias) {
        return { error: "Alias already exists" };
    }

    // check if domain is a custom domain (and they have access to it) or just a default domain
    const [defaultDomain, customDomain, aliasCount, mailbox] = await db.batchFetch([
        db.query.DefaultDomain.findFirst({
            where: and(
                eq(sql`lower(${DefaultDomain.domain})`, sql`lower(${alias.split("@")[1]})`),
                not(eq(DefaultDomain.tempDomain, true)),
                eq(DefaultDomain.available, true),
                eq(DefaultDomain.isDeleted, false),
            ),
        }),

        db.query.MailboxCustomDomain.findFirst({
            where: and(
                eq(MailboxCustomDomain.mailboxId, mailboxId),
                eq(sql`lower(${MailboxCustomDomain.domain})`, sql`lower(${alias.split("@")[1]})`),
                eq(MailboxCustomDomain.isDeleted, false),
            ),
        }),

        db
            .select({ count: count() })
            .from(MailboxAlias)
            .where(and(eq(MailboxAlias.mailboxId, mailboxId), eq(MailboxAlias.isDeleted, false))),

        db.query.Mailbox.findFirst({
            where: eq(Mailbox.id, mailboxId),
            columns: {
                plan: true,
            },
        }),
    ]);

    if (!(defaultDomain || customDomain)) {
        return {
            error: "You don't have access to this domain, please add it as custom domain.",
        };
    }

    if (defaultDomain && mailbox?.plan !== "UNLIMITED") {
        const emailPart = alias.split("@")[0];

        if (emailPart.length <= 3) {
            return { error: "Email too short" };
        }
        if (impersonatingEmails.some((v) => emailPart.toLowerCase().includes(v))) {
            return { error: "Invalid alias" };
        }
    }

    if (aliasCount[0].count >= aliasLimit[mailbox?.plan ?? "FREE"]) {
        return { error: "Alias limit reached" };
    }

    // add alias
    await db
        .insert(MailboxAlias)
        .values({
            mailboxId,
            alias,
            name,
        })
        .execute();

    // revalidateTag(`mailbox-aliases-${mailboxId}`);

    return { success: "Alias added" }
}

export interface EditAliasData {
    aliasId: string;
    name: string | null;
}
async function editAlias(mailboxId: string, data: EditAliasData) {
    const { aliasId, name } = data;

    // check if alias exists
    const existingAlias = await db.query.MailboxAlias.findFirst({
        where: and(eq(MailboxAlias.id, aliasId), eq(MailboxAlias.isDeleted, false)),
        columns: {
            id: true,
        },
    });

    if (!existingAlias) {
        return { error: "Alias not found" };
    }

    // edit alias
    await db
        .update(MailboxAlias)
        .set({
            name,
        })
        .where(and(eq(MailboxAlias.id, aliasId), eq(MailboxAlias.isDeleted, false)))
        .execute();

    // revalidateTag(`mailbox-aliases-${mailboxId}`);

    return { success: "Alias edited" }
}

export interface ChangeDefaultAliasData {
    defaultAliasId: string;
}
async function changeDefaultAlias(mailboxId: string, data: ChangeDefaultAliasData) {
    const { defaultAliasId } = data;

    // check if alias exists
    const existingAlias = await db.query.MailboxAlias.findFirst({
        where: and(eq(MailboxAlias.id, defaultAliasId), eq(MailboxAlias.isDeleted, false)),
        columns: {
            id: true,
        },
    });

    if (!existingAlias) {
        return { error: "Alias not found" };
    }

    // edit alias
    await db.batchUpdate([
        db
            .update(MailboxAlias)
            .set({
                default: false,
            })
            .where(
                and(
                    eq(MailboxAlias.mailboxId, mailboxId),
                    not(eq(MailboxAlias.id, defaultAliasId)),
                    eq(MailboxAlias.isDeleted, false),
                ),
            ),

        db
            .update(MailboxAlias)
            .set({
                default: true,
            })
            .where(
                and(
                    eq(MailboxAlias.mailboxId, mailboxId),
                    eq(MailboxAlias.id, defaultAliasId),
                    eq(MailboxAlias.isDeleted, false),
                ),
            ),
    ]);

    // revalidateTag(`mailbox-aliases-${mailboxId}`);

    return { success: "Default alias changed" }
}

export interface DeleteAliasData {
    aliasId: string;
}
async function deleteAlias(mailboxId: string, data: DeleteAliasData) {
    const { aliasId } = data;

    const alias = await db.query.MailboxAlias.findFirst({
        where: and(
            eq(MailboxAlias.id, aliasId),
            eq(MailboxAlias.mailboxId, mailboxId),
            eq(MailboxAlias.isDeleted, false),
        ),
        columns: {
            default: true,
            alias: true,
        },
    });

    if (!alias) {
        return { error: "Alias not found" };
    }
    if (alias.default) {
        return { error: "Cannot delete default alias" };
    }

    await db
        .update(MailboxAlias)
        .set({
            isDeleted: true,
            // if alias is emailthing.xyz, we don't want to delete it, so people can't use it again
            alias: alias.alias.endsWith("@emailthing.xyz") ? alias.alias : `<deleted>@${createId()}_`,
            default: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            name: "<deleted>",
        })
        .where(eq(MailboxAlias.id, aliasId))
        .execute();

    // revalidateTag(`mailbox-aliases-${mailboxId}`);

    return { success: "Alias deleted" }
}

export interface CreateTempAliasData {
    domain: string;
    name: string | null;
}
async function createTempAlias(mailboxId: string, data: CreateTempAliasData) {
    const { domain, name } = data;

    // check that aliasDomain is public and available
    const defaultDomain = await db.query.DefaultDomain.findFirst({
        where: and(
            eq(sql`lower(${DefaultDomain.domain})`, sql`lower(${domain})`),
            eq(DefaultDomain.available, true),
            eq(DefaultDomain.tempDomain, true),
            eq(DefaultDomain.isDeleted, false),
        ),
    });
    if (!defaultDomain) {
        return { error: "Domain not available" };
    }

    // todo support mailbox custom temp domains
    // todo also limit temp aliases per mailbox

    const tempId = createId();
    const alias = `${createSmallId()}@${domain}`;
    // a day lasting
    const expires = new Date(Date.now() + TEMP_EMAIL_EXPIRES_IN);

    await db
        .insert(TempAlias)
        .values({
            id: tempId,
            mailboxId,
            name,
            expiresAt: expires,
            alias,
        })
        .execute();

    return {
        success: alias,
        description: `This alias will expire in ${Math.ceil(TEMP_EMAIL_EXPIRES_IN / 1000 / 60 / 60)} hours`,
    };
}

export interface DeleteCustomDomainData {
    domainId: string;
}
async function deleteCustomDomain(mailboxId: string, data: DeleteCustomDomainData) {
    const { domainId } = data;

    const domain = await db.query.MailboxCustomDomain.findFirst({
        where: and(
            eq(MailboxCustomDomain.id, domainId),
            eq(MailboxCustomDomain.mailboxId, mailboxId),
            eq(MailboxCustomDomain.isDeleted, false),
        ),
    });

    const defaultAliasFromThis = await db.query.MailboxAlias.findFirst({
        where: and(
            eq(MailboxAlias.mailboxId, mailboxId),
            eq(MailboxAlias.default, true),
            like(sql`lower(${MailboxAlias.alias})`, sql`lower(${`%@${domain?.domain}`})`),
            eq(MailboxAlias.isDeleted, false),
        ),
    });

    if (!domain) {
        return { error: "Domain not found" };
    }
    if (defaultAliasFromThis) {
        return { error: "Cannot delete domain with default alias" };
    }

    // also delete all aliases with that domain
    await db.batchUpdate([
        db
            .update(MailboxCustomDomain)
            .set({
                isDeleted: true,
                domain: `<deleted>@${createId()}_`,
                addedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(MailboxCustomDomain.id, domainId)),

        db
            .update(MailboxAlias)
            .set({
                isDeleted: true,
                alias: `<deleted>@${createId()}_`,
                default: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                name: "<deleted>",
            })
            .where(
                and(
                    eq(MailboxAlias.mailboxId, mailboxId),
                    like(sql`lower(${MailboxAlias.alias})`, sql`lower(${`%@${domain.domain}`})`),
                    not(eq(MailboxAlias.default, true)),
                ),
            ),
    ]);

    // revalidateTag(`mailbox-aliases-${mailboxId}`);
    return { success: "Custom domain deleted" }
}

export interface MakeTokenData {
    name: string | null;
}
async function makeToken(mailboxId: string, data: MakeTokenData) {
    const { name } = data;

    try {
        const token = generateToken();
        await db
            .insert(MailboxTokens)
            .values({
                token,
                mailboxId,
                name,
            })
            .execute();

        return { success: "Token created", token }
    } catch (e) {
        return { error: "Failed to create token" };
    }
}

export interface DeleteTokenData {
    tokenId: string;
}
async function deleteToken(mailboxId: string, data: DeleteTokenData) {
    const { tokenId } = data;

    await db
        .update(MailboxTokens)
        .set({
            isDeleted: true,
            token: `<deleted>@${createId()}_`,
            name: "<deleted>",
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        .where(and(eq(MailboxTokens.id, tokenId), eq(MailboxTokens.mailboxId, mailboxId)))
        .execute();

    return { success: "Token deleted" }
}

export interface AddUserData {
    username: string;
    role: "ADMIN";
}
async function addUserToMailbox(currentUserRole: "OWNER" | "ADMIN" | "NONE", mailboxId: string, data: AddUserData) {
    const { username, role } = data;

    // check if the current user is an owner
    if (currentUserRole !== "OWNER") {
        return { error: "Only owner can add someone to the mailbox" };
    }

    // check how many users are in the mailbox
    const [mailboxUsers, mailbox] = await db.batchFetch([
        db
            .select({ count: count() })
            .from(MailboxForUser)
            .where(and(eq(MailboxForUser.mailboxId, mailboxId), eq(MailboxForUser.isDeleted, false))),
        db.query.Mailbox.findFirst({
            where: and(eq(Mailbox.id, mailboxId), eq(Mailbox.isDeleted, false)),
            columns: {
                plan: true,
            },
        }),
    ]);

    if (!mailbox || mailboxUsers[0].count >= mailboxUsersLimit[mailbox.plan]) {
        return { error: "Mailbox users limit reached" };
    }

    // check if user exists
    const proposedUser = await db.query.User.findFirst({
        where: eq(sql`lower(${User.username})`, sql`lower(${username})`),
        columns: {
            id: true,
            username: true,
        },
    });

    if (!proposedUser) {
        return { error: `Can't find user "${username}"` };
    }

    // check if they already have access
    const userAccess = await db.query.MailboxForUser.findFirst({
        where: and(eq(MailboxForUser.mailboxId, mailboxId), eq(MailboxForUser.userId, proposedUser.id), eq(MailboxForUser.isDeleted, false)),
    });
    if (userAccess) {
        return { error: "User already has access to this mailbox" };
    }

    // check how many other mailboxes the user is in
    const userMailboxes = await db
        .select({ count: count() })
        .from(MailboxForUser)
        .where(and(eq(MailboxForUser.userId, proposedUser.id), eq(MailboxForUser.isDeleted, false)))
        .execute();

    // TODO: either make it 5 free mailboxes or somehow make a plan for this
    // (mailboxes having the free plan sounds better then users having pro, but this is harder)
    if (userMailboxes[0].count >= 5) {
        return { error: "User is already in 5 other mailboxes" };
    }

    const validRoles = ["ADMIN"];
    if (!validRoles.includes(role)) {
        return { error: "Invalid role" };
    }

    // if the user used to be in the mailbox, we need to delete the old entry (to be able to add them again)
    // technically this could be abused to lower someone's role, but thats why only OWNER can do this (and only one owner per mailbox)
    await db
        .delete(MailboxForUser)
        .where(and(eq(MailboxForUser.userId, proposedUser.id), eq(MailboxForUser.mailboxId, mailboxId)))
        .execute();

    // add user to mailbox
    await db
        .insert(MailboxForUser)
        .values({
            mailboxId,
            userId: proposedUser.id,
            role,
        })
        .execute();

    // revalidateTag(`user-mailbox-access-${mailboxId}-${proposedUser.id}`);
    // revalidateTag(`user-mailboxes-${proposedUser.id}`);
    return { success: `Added @${proposedUser.username} to this mailbox` }
}

export interface RemoveUserData {
    userId: string;
}
async function removeUserFromMailbox(currentUserRole: "OWNER" | "ADMIN" | "NONE", mailboxId: string, data: RemoveUserData) {
    const { userId } = data;

    // check if the current user is an owner
    if (currentUserRole !== "OWNER") {
        return { error: "Only owner can remove someone from the mailbox" };
    }

    // check if the current user is an admin
    const userRole = await db.query.MailboxForUser.findFirst({
        where: and(
            eq(MailboxForUser.mailboxId, mailboxId),
            eq(MailboxForUser.userId, userId),
            eq(MailboxForUser.isDeleted, false),
        ),
        columns: {
            role: true,
        },
    });

    if (userRole?.role === "OWNER") {
        return { error: "User is owner, cannot remove them" };
    }

    // check if user exists
    const proposedUser = await db.query.User.findFirst({
        where: eq(User.id, userId),
        columns: {
            id: true,
            username: true,
        },
    });

    if (!proposedUser) {
        return { error: `Can't find user with id "${userId}"` };
    }

    // remove user from mailbox
    await db
        .update(MailboxForUser)
        .set({
            isDeleted: true,
            joinedAt: new Date(),
            updatedAt: new Date(),
            role: "NONE",
        })
        .where(
            and(
                eq(MailboxForUser.mailboxId, mailboxId),
                eq(MailboxForUser.userId, userId),
                not(eq(MailboxForUser.role, "OWNER")),
            ),
        )
        .execute();

    // revalidateTag(`user-mailbox-access-${mailboxId}-${userId}`);
    // revalidateTag(`user-mailboxes-${userId}`);
    return { success: `Removed @${proposedUser.username} from this mailbox` }
}
