"use server";

import {
    DefaultDomain,
    Mailbox,
    MailboxAlias,
    MailboxCategory,
    MailboxCustomDomain,
    MailboxForUser,
    MailboxTokens,
    User,
    db,
} from "@/db";
import { getCurrentUser } from "@/utils/jwt";
import { aliasLimit, customDomainLimit, mailboxUsersLimit } from "@/utils/limits";
import { generateToken } from "@/utils/token";
import { emailSchema } from "@/validations/auth";
import { impersonatingEmails } from "@/validations/invalid-emails";
import { and, count, eq, like, not } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { userMailboxAccess } from "../tools";

export async function verifyDomain(mailboxId: string, customDomain: string) {
    const userId = await getCurrentUser();
    if (!(userId && (await userMailboxAccess(mailboxId, userId)))) {
        throw new Error("Mailbox not found");
    }

    // check if mailbox plan allows for more than 1 custom domain
    const [mailbox, customDomains, exists] = await db.batch([
        db.query.Mailbox.findFirst({
            where: eq(Mailbox.id, mailboxId),
            columns: {
                plan: true,
            },
        }),

        db.select({ count: count() }).from(MailboxCustomDomain).where(and(eq(MailboxCustomDomain.mailboxId, mailboxId), eq(MailboxCustomDomain.isDeleted, false))),

        db.query.MailboxCustomDomain.findFirst({
            where: and(eq(MailboxCustomDomain.domain, customDomain), eq(MailboxCustomDomain.mailboxId, mailboxId), eq(MailboxCustomDomain.isDeleted, false)),
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
        throw new Error("Custom domain not found");
    }

    if (exists) {
        // return { error: "You have already verified this domain" }
        return revalidatePath(`/mail/${mailboxId}/config`);
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

    return revalidatePath(`/mail/${mailboxId}/config`);
}

export async function addAlias(mailboxId: string, alias: string, name: string | null) {
    const userId = await getCurrentUser();
    if (!(userId && (await userMailboxAccess(mailboxId, userId)))) {
        throw new Error("Mailbox not found");
    }

    // check emailSchema
    const validEmail = emailSchema.safeParse({ email: alias });
    if (!validEmail.success) {
        return { error: validEmail.error.errors[0].message };
    }

    // check if alias exists
    const existingAlias = await db.query.MailboxAlias.findFirst({
        // intentionally not checking if it's deleted, as we don't want people to get already used aliases
        where: eq(MailboxAlias.alias, alias),
        columns: {
            id: true,
        },
    });

    if (existingAlias) {
        return { error: "Alias already exists" };
    }

    // check if domain is a custom domain (and they have access to it) or just a default domain
    const [defaultDomain, customDomain, aliasCount, mailbox] = await db.batch([
        db.query.DefaultDomain.findFirst({
            where: and(eq(DefaultDomain.domain, alias.split("@")[1]), not(eq(DefaultDomain.tempDomain, true)), eq(DefaultDomain.isDeleted, false)),
        }),

        db.query.MailboxCustomDomain.findFirst({
            where: and(
                eq(MailboxCustomDomain.mailboxId, mailboxId),
                eq(MailboxCustomDomain.domain, alias.split("@")[1]),
                eq(MailboxCustomDomain.isDeleted, false),
            ),
        }),

        db.select({ count: count() }).from(MailboxAlias).where(and(eq(MailboxAlias.mailboxId, mailboxId), eq(MailboxAlias.isDeleted, false))),

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

    revalidateTag(`mailbox-aliases-${mailboxId}`);

    return revalidatePath(`/mail/${mailboxId}/config`);
}

export async function editAlias(mailboxId: string, aliasId: string, name: string | null) {
    const userId = await getCurrentUser();
    if (!(userId && (await userMailboxAccess(mailboxId, userId)))) {
        throw new Error("Mailbox not found");
    }

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

    revalidateTag(`mailbox-aliases-${mailboxId}`);

    return revalidatePath(`/mail/${mailboxId}/config`);
}

export async function changeDefaultAlias(mailboxId: string, defaultAliasId: string) {
    const userId = await getCurrentUser();
    if (!(userId && (await userMailboxAccess(mailboxId, userId)))) {
        throw new Error("Mailbox not found");
    }

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
    await db.batch([
        db
            .update(MailboxAlias)
            .set({
                default: false,
            })
            .where(and(eq(MailboxAlias.mailboxId, mailboxId), not(eq(MailboxAlias.id, defaultAliasId)), eq(MailboxAlias.isDeleted, false))),

        db
            .update(MailboxAlias)
            .set({
                default: true,
            })
            .where(and(eq(MailboxAlias.mailboxId, mailboxId), eq(MailboxAlias.id, defaultAliasId), eq(MailboxAlias.isDeleted, false))),
    ]);

    revalidateTag(`mailbox-aliases-${mailboxId}`);

    return revalidatePath(`/mail/${mailboxId}/config`);
}

export async function deleteAlias(mailboxId: string, aliasId: string) {
    const userId = await getCurrentUser();
    if (!(userId && (await userMailboxAccess(mailboxId, userId)))) {
        throw new Error("Mailbox not found");
    }

    const alias = await db.query.MailboxAlias.findFirst({
        where: and(eq(MailboxAlias.id, aliasId), eq(MailboxAlias.mailboxId, mailboxId), eq(MailboxAlias.isDeleted, false)),
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

    await db.update(MailboxAlias).set({
        isDeleted: true,
        // if alias is emailthing.xyz, we don't want to delete it, so people can't use it again
        alias: alias.alias.endsWith("@emailthing.xyz") ? alias.alias : "<deleted>",
        default: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        name: "<deleted>"
    }).where(eq(MailboxAlias.id, aliasId)).execute();

    revalidateTag(`mailbox-aliases-${mailboxId}`);

    return revalidatePath(`/mail/${mailboxId}/config`);
}

export async function deleteCustomDomain(mailboxId: string, customDomainId: string) {
    const userId = await getCurrentUser();
    if (!(userId && (await userMailboxAccess(mailboxId, userId)))) {
        throw new Error("Mailbox not found");
    }

    const domain = await db.query.MailboxCustomDomain.findFirst({
        where: and(eq(MailboxCustomDomain.id, customDomainId), eq(MailboxCustomDomain.mailboxId, mailboxId), eq(MailboxCustomDomain.isDeleted, false)),
    });

    const defaultAliasFromThis = await db.query.MailboxAlias.findFirst({
        where: and(
            eq(MailboxAlias.mailboxId, mailboxId),
            eq(MailboxAlias.default, true),
            like(MailboxAlias.alias, `%@${domain?.domain}`),
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
    await db.batch([
        db.update(MailboxCustomDomain).set({
            isDeleted: true,
            domain: "<deleted>",
            addedAt: new Date(),
            updatedAt: new Date(),
        }).where(eq(MailboxCustomDomain.id, customDomainId)),

        db
            .update(MailboxAlias)
            .set({
                isDeleted: true,
                alias: "<deleted>@<deleted>",
                default: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                name: "<deleted>"
            }).where(
                and(
                    eq(MailboxAlias.mailboxId, mailboxId),
                    like(MailboxAlias.alias, `%@${domain.domain}`),
                    not(eq(MailboxAlias.default, true)),
                ),
            ),
    ]);

    revalidateTag(`mailbox-aliases-${mailboxId}`);
    return revalidatePath(`/mail/${mailboxId}/config`);
}

export async function makeToken(mailboxId: string, name: string | null) {
    const userId = await getCurrentUser();
    if (!(userId && (await userMailboxAccess(mailboxId, userId)))) {
        throw new Error("Mailbox not found");
    }

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

        revalidatePath(`/mail/${mailboxId}/config`);
        // only ever time the token is shown in full to user
        return { token };
    } catch (e) {
        return { error: "Failed to create token" };
    }
}

export async function deleteToken(mailboxId: string, token: string) {
    const userId = await getCurrentUser();
    if (!(userId && (await userMailboxAccess(mailboxId, userId)))) {
        throw new Error("Mailbox not found");
    }

    await db
        .update(MailboxTokens).set({
            isDeleted: true,
            token: "<deleted>",
            name: "<deleted>",
            createdAt: new Date(),
            updatedAt: new Date(),
        }).where(and(eq(MailboxTokens.token, token), eq(MailboxTokens.mailboxId, mailboxId)))
        .execute();

    revalidatePath(`/mail/${mailboxId}/config`);
}

const categoryColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export async function createCategory(mailboxId: string, name: string, color: string | null) {
    const userId = await getCurrentUser();
    if (!(userId && (await userMailboxAccess(mailboxId, userId)))) {
        throw new Error("Mailbox not found");
    }

    if (color && !categoryColorRegex.test(color)) {
        return { error: "Invalid color" };
    }

    await db
        .insert(MailboxCategory)
        .values({
            mailboxId,
            name,
            color,
        })
        .execute();

    revalidateTag(`mailbox-categories-${mailboxId}`);
    revalidatePath(`/mail/${mailboxId}/config`);
}

export async function editCategory(mailboxId: string, categoryId: string, name: string, color: string | null) {
    const userId = await getCurrentUser();
    if (!(userId && (await userMailboxAccess(mailboxId, userId)))) {
        throw new Error("Mailbox not found");
    }

    if (color && !categoryColorRegex.test(color)) {
        return { error: "Invalid color" };
    }

    await db
        .update(MailboxCategory)
        .set({
            name,
            color,
        })
        .where(and(eq(MailboxCategory.id, categoryId), eq(MailboxCategory.mailboxId, mailboxId), eq(MailboxCategory.isDeleted, false)))
        .execute();

    revalidateTag(`mailbox-categories-${mailboxId}`);
    revalidatePath(`/mail/${mailboxId}/config`);
}

export async function deleteCategory(mailboxId: string, categoryId: string) {
    const userId = await getCurrentUser();
    if (!(userId && (await userMailboxAccess(mailboxId, userId)))) {
        throw new Error("Mailbox not found");
    }

    await db
        .update(MailboxCategory).set({
            isDeleted: true,
            name: "<deleted>",
            color: "<deleted>",
            createdAt: new Date(),
            updatedAt: new Date(),
        }).where(and(eq(MailboxCategory.id, categoryId), eq(MailboxCategory.mailboxId, mailboxId), eq(MailboxCategory.isDeleted, false)))
        .execute();

    revalidateTag(`mailbox-categories-${mailboxId}`);
    revalidatePath(`/mail/${mailboxId}/config`);
}

export async function addUserToMailbox(mailboxId: string, username: string, role: "ADMIN") {
    const userId = await getCurrentUser();
    if (!(userId && (await userMailboxAccess(mailboxId, userId)))) {
        throw new Error("Mailbox not found");
    }

    // check if the current user is an admin
    const userRole = await db.query.MailboxForUser.findFirst({
        where: and(eq(MailboxForUser.mailboxId, mailboxId), eq(MailboxForUser.userId, userId), eq(MailboxForUser.isDeleted, false)),
        columns: {
            role: true,
        },
    });

    if (userRole?.role !== "OWNER") {
        return { error: "Only owner can add someone to the mailbox" };
    }

    // check how many users are in the mailbox
    const [mailboxUsers, mailbox] = await db.batch([
        db.select({ count: count() }).from(MailboxForUser).where(and(eq(MailboxForUser.mailboxId, mailboxId), eq(MailboxForUser.isDeleted, false))),
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
        where: eq(User.username, username),
        columns: {
            id: true,
        },
    });

    if (!proposedUser) {
        return { error: `Can't find user "${username}"` };
    }

    // check if they already have access
    if (await userMailboxAccess(mailboxId, proposedUser.id)) {
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
    await db.delete(MailboxForUser).where(and(eq(MailboxForUser.userId, proposedUser.id), eq(MailboxForUser.mailboxId, mailboxId))).execute();

    // add user to mailbox
    await db
        .insert(MailboxForUser)
        .values({
            mailboxId,
            userId: proposedUser.id,
            role,
        })
        .execute();

    revalidateTag(`user-mailbox-access-${mailboxId}-${proposedUser.id}`);
    revalidateTag(`user-mailboxes-${proposedUser.id}`);
    revalidatePath(`/mail/${mailboxId}/config`);
}

export async function removeUserFromMailbox(mailboxId: string, userId: string) {
    const currentUserId = await getCurrentUser();
    if (!(currentUserId && (await userMailboxAccess(mailboxId, currentUserId)))) {
        throw new Error("Mailbox not found");
    }

    // check if the current user is an admin
    const userRole = await db.query.MailboxForUser.findFirst({
        where: and(eq(MailboxForUser.mailboxId, mailboxId), eq(MailboxForUser.userId, currentUserId), eq(MailboxForUser.isDeleted, false)),
        columns: {
            role: true,
        },
    });

    if (userRole?.role !== "OWNER") {
        return { error: "Only owner can remove someone from the mailbox" };
    }

    // check if user exists
    const proposedUser = await db.query.User.findFirst({
        where: eq(User.id, userId),
        columns: {
            id: true,
        },
    });

    if (!proposedUser) {
        return { error: `Can't find user with id "${userId}"` };
    }

    // remove user from mailbox
    await db
        .update(MailboxForUser).set({
            isDeleted: true,
            joinedAt: new Date(),
            updatedAt: new Date(),
            role: "NONE",
        }).where(
            and(
                eq(MailboxForUser.mailboxId, mailboxId),
                eq(MailboxForUser.userId, userId),
                not(eq(MailboxForUser.role, "OWNER")),
            ),
        )
        .execute();

    revalidateTag(`user-mailbox-access-${mailboxId}-${userId}`);
    revalidateTag(`user-mailboxes-${userId}`);
    revalidatePath(`/mail/${mailboxId}/config`);
}

export async function leaveMailbox(mailboxId: string) {
    const currentUserId = await getCurrentUser();
    if (!currentUserId) {
        throw new Error("Mailbox not found");
    }

    // check if user exists
    const proposedUser = await db.query.User.findFirst({
        where: eq(User.id, currentUserId),
        columns: {
            id: true,
        },
    });

    if (!proposedUser) {
        return { error: `Can't find user with id "${currentUserId}"` };
    }

    // check if they are owner
    const userRole = await db.query.MailboxForUser.findFirst({
        where: and(eq(MailboxForUser.mailboxId, mailboxId), eq(MailboxForUser.userId, currentUserId), eq(MailboxForUser.isDeleted, false)),
        columns: {
            role: true,
        },
    });

    if (userRole?.role === "OWNER") {
        return { error: "Owner can't leave the mailbox" };
    }

    // remove user from mailbox
    await db
        .update(MailboxForUser).set({
            isDeleted: true,
            joinedAt: new Date(),
            updatedAt: new Date(),
            role: "NONE",
        }).where(
            and(
                eq(MailboxForUser.mailboxId, mailboxId),
                eq(MailboxForUser.userId, currentUserId),
                not(eq(MailboxForUser.role, "OWNER")),
            ),
        )
        .execute();

    revalidateTag(`user-mailbox-access-${mailboxId}-${currentUserId}`);
    revalidateTag(`user-mailboxes-${currentUserId}`);
    revalidatePath(`/mail/${mailboxId}/config`);
    (await cookies()).delete("mailboxId");
    redirect("/mail");
}
