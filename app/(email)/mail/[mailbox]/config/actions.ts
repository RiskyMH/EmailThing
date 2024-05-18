'use server';

import { getCurrentUser } from "@/utils/jwt";
import { userMailboxAccess } from "../tools";
import { db, DefaultDomain, Mailbox, MailboxAlias, MailboxCategory, MailboxCustomDomain, MailboxTokens, MailboxForUser, User } from "@/db";
import { aliasLimit, customDomainLimit, mailboxUsersLimit } from "@/utils/limits";
import { revalidatePath, revalidateTag } from "next/cache";
import { emailSchema } from "@/validations/auth";
import { and, count, eq, like, not } from "drizzle-orm";
import { generateToken } from "@/utils/token";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { impersonatingEmails } from "@/validations/invalid-emails";

export async function verifyDomain(mailboxId: string, customDomain: string) {
    const userId = await getCurrentUser()
    if (!userId || !await userMailboxAccess(mailboxId, userId)) {
        throw new Error("Mailbox not found");
    }

    // check if mailbox plan allows for more than 1 custom domain
    const [mailbox, customDomains, exists] = await db.batch([
        db.query.Mailbox.findFirst({
            where: eq(Mailbox.id, mailboxId),
            columns: {
                plan: true,
            }
        }),

        db.select({ count: count() })
            .from(MailboxCustomDomain)
            .where(eq(MailboxCustomDomain.mailboxId, mailboxId)),

        db.query.MailboxCustomDomain.findFirst({
            where: and(
                eq(MailboxCustomDomain.domain, customDomain),
                eq(MailboxCustomDomain.mailboxId, mailboxId)
            ),
            columns: {
                id: true
            }
        })

    ]);

    if (!mailbox) {
        throw new Error("Mailbox not found");
    }

    if (customDomainLimit[mailbox.plan] <= customDomains[0].count) {
        return { error: "Custom domain limit reached" }
    }

    if (!customDomain) {
        throw new Error("Custom domain not found");
    }


    if (exists) {
        console.log(exists)
        // return { error: "You have already verified this domain" }
        return revalidatePath(`/mail/${mailboxId}/config`);
    }

    // verify domain by checking txt records on _emailthing.<domain> and check if one of the txt records has their mailbox id
    // use 1.1.1.1 doh api
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=_emailthing.${encodeURIComponent(customDomain)}&type=TXT`, {
        headers: {
            "accept": "application/dns-json",
        },
        cache: "no-cache"
    });

    const json = await res.json();

    if (json.Status !== 0) {
        return { error: "Failed to verify domain" }
    }

    const txtRecords = json?.Answer?.filter((a: any) => a.type === 16) || [];

    if (txtRecords.length === 0) {
        return { error: "No txt records found" }
    }

    const verified = txtRecords.some((r: any) => r.data.includes(`mailbox=${mailboxId}`));

    if (!verified) {
        return { error: "Domain not verified" }
    }

    // make domain
    await db.insert(MailboxCustomDomain)
        .values({
            domain: customDomain,
            mailboxId,
        })
        .execute()

    return revalidatePath(`/mail/${mailboxId}/config`);
}

export async function addAlias(mailboxId: string, alias: string, name: string | null) {
    const userId = await getCurrentUser()
    if (!userId || !await userMailboxAccess(mailboxId, userId)) {
        throw new Error("Mailbox not found");
    }

    // check emailSchema
    const validEmail = emailSchema.safeParse({ email: alias })
    if (!validEmail.success) {
        return { error: validEmail.error.errors[0].message }
    }

    // check if alias exists
    const existingAlias = await db.query.MailboxAlias.findFirst({
        where: eq(MailboxAlias.alias, alias),
        columns: {
            id: true
        }
    })

    if (existingAlias) {
        return { error: "Alias already exists" }
    }

    // check if domain is a custom domain (and they have access to it) or just a default domain
    const [defaultDomain, customDomain, aliasCount, mailbox] = await db.batch([
        db.query.DefaultDomain.findFirst({
            where: and(
                eq(DefaultDomain.domain, alias.split("@")[1]),
                not(eq(DefaultDomain.tempDomain, true))
            )
        }),

        db.query.MailboxCustomDomain.findFirst({
            where: and(
                eq(MailboxCustomDomain.mailboxId, mailboxId),
                eq(MailboxCustomDomain.domain, alias.split("@")[1])
            )
        }),

        db.select({ count: count() })
            .from(MailboxAlias)
            .where(eq(MailboxAlias.mailboxId, mailboxId)),

        db.query.Mailbox.findFirst({
            where: eq(Mailbox.id, mailboxId),
            columns: {
                plan: true
            }
        })

    ])

    if (!defaultDomain && !customDomain) {
        return { error: "You don't have access to this domain, please add it as custom domain." }
    }

    if (defaultDomain && mailbox?.plan != "UNLIMITED") {
        const emailPart = alias.split("@")[0]

        if (emailPart.length <= 3) {
            return { error: "Email too short" }
        }
        else if (impersonatingEmails.some(v => emailPart.includes(v))) {
            return { error: "Invalid alias" }
        }
    }

    if (aliasCount[0].count >= aliasLimit[mailbox?.plan ?? "FREE"]) {
        return { error: "Alias limit reached" }
    }

    // add alias
    await db.insert(MailboxAlias)
        .values({
            mailboxId,
            alias,
            name
        })
        .execute()

    revalidateTag(`mailbox-aliases-${mailboxId}`)

    return revalidatePath(`/mail/${mailboxId}/config`);
}

export async function editAlias(mailboxId: string, aliasId: string, name: string | null) {
    const userId = await getCurrentUser()
    if (!userId || !await userMailboxAccess(mailboxId, userId)) {
        throw new Error("Mailbox not found");
    }

    // check if alias exists
    const existingAlias = await db.query.MailboxAlias.findFirst({
        where: eq(MailboxAlias.id, aliasId),
        columns: {
            id: true
        }
    })

    if (!existingAlias) {
        return { error: "Alias not found" }
    }

    // edit alias
    await db.update(MailboxAlias)
        .set({
            name
        })
        .where(eq(MailboxAlias.id, aliasId))
        .execute()

    revalidateTag(`mailbox-aliases-${mailboxId}`)

    return revalidatePath(`/mail/${mailboxId}/config`);
}

export async function changeDefaultAlias(mailboxId: string, defaultAliasId: string) {
    const userId = await getCurrentUser()
    if (!userId || !await userMailboxAccess(mailboxId, userId)) {
        throw new Error("Mailbox not found");
    }

    // check if alias exists
    const existingAlias = await db.query.MailboxAlias.findFirst({
        where: eq(MailboxAlias.id, defaultAliasId),
        columns: {
            id: true
        }
    })

    if (!existingAlias) {
        return { error: "Alias not found" }
    }

    // edit alias
    await db.batch([
        db.update(MailboxAlias)
            .set({
                default: false
            })
            .where(and(
                eq(MailboxAlias.mailboxId, mailboxId),
                not(eq(MailboxAlias.id, defaultAliasId))
            )),

        db.update(MailboxAlias)
            .set({
                default: true
            })
            .where(and(
                eq(MailboxAlias.mailboxId, mailboxId),
                eq(MailboxAlias.id, defaultAliasId)
            ))
    ]);

    revalidateTag(`mailbox-aliases-${mailboxId}`)

    return revalidatePath(`/mail/${mailboxId}/config`);
}

export async function deleteAlias(mailboxId: string, aliasId: string) {
    const userId = await getCurrentUser()
    if (!userId || !await userMailboxAccess(mailboxId, userId)) {
        throw new Error("Mailbox not found");
    }

    const alias = await db.query.MailboxAlias.findFirst({
        where: and(
            eq(MailboxAlias.id, aliasId),
            eq(MailboxAlias.mailboxId, mailboxId),
        ),
        columns: {
            default: true
        }
    })

    if (!alias) {
        return { error: "Alias not found" }
    } else if (alias.default) {
        return { error: "Cannot delete default alias" }
    }

    await db.delete(MailboxAlias)
        .where(eq(MailboxAlias.id, aliasId))
        .execute()

    revalidateTag(`mailbox-aliases-${mailboxId}`)

    return revalidatePath(`/mail/${mailboxId}/config`);
}

export async function deleteCustomDomain(mailboxId: string, customDomainId: string) {
    const userId = await getCurrentUser()
    if (!userId || !await userMailboxAccess(mailboxId, userId)) {
        throw new Error("Mailbox not found");
    }

    const domain = await db.query.MailboxCustomDomain.findFirst({
        where: and(
            eq(MailboxCustomDomain.id, customDomainId),
            eq(MailboxCustomDomain.mailboxId, mailboxId),
        )
    })

    const defaultAliasFromThis = await db.query.MailboxAlias.findFirst({
        where: and(
            eq(MailboxAlias.mailboxId, mailboxId),
            eq(MailboxAlias.default, true),
            like(MailboxAlias.alias, `%@${domain?.domain}`)
        )
    })

    if (!domain) {
        return { error: "Domain not found" }
    } else if (defaultAliasFromThis) {
        return { error: "Cannot delete domain with default alias" }
    }

    // also delete all aliases with that domain
    await db.batch([
        db.delete(MailboxCustomDomain)
            .where(eq(MailboxCustomDomain.id, customDomainId)),

        db.delete(MailboxAlias)
            .where(and(
                eq(MailboxAlias.mailboxId, mailboxId),
                like(MailboxAlias.alias, `%@${domain.domain}`),
                not(eq(MailboxAlias.default, true))
            ))
    ])

    revalidateTag(`mailbox-aliases-${mailboxId}`)
    return revalidatePath(`/mail/${mailboxId}/config`);
}

export async function makeToken(mailboxId: string, name: string | null) {
    const userId = await getCurrentUser()
    if (!userId || !await userMailboxAccess(mailboxId, userId)) {
        throw new Error("Mailbox not found");
    }

    try {
        const token = generateToken();
        await db.insert(MailboxTokens)
            .values({
                token,
                mailboxId,
                name
            })
            .execute()

        revalidatePath(`/mail/${mailboxId}/config`);
        return { token }
    } catch (e) {
        return { error: "Failed to create token" }
    }
}

export async function deleteToken(mailboxId: string, token: string) {
    const userId = await getCurrentUser()
    if (!userId || !await userMailboxAccess(mailboxId, userId)) {
        throw new Error("Mailbox not found");
    }

    await db.delete(MailboxTokens)
        .where(and(
            eq(MailboxTokens.token, token),
            eq(MailboxTokens.mailboxId, mailboxId)
        ))
        .execute()

    revalidatePath(`/mail/${mailboxId}/config`);
}


const categoryColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export async function createCategory(mailboxId: string, name: string, color: string | null) {
    const userId = await getCurrentUser()
    if (!userId || !await userMailboxAccess(mailboxId, userId)) {
        throw new Error("Mailbox not found");
    }

    if (color && !categoryColorRegex.test(color)) {
        return { error: "Invalid color" }
    }

    await db.insert(MailboxCategory)
        .values({
            mailboxId,
            name,
            color
        })
        .execute()

    revalidateTag(`mailbox-categories-${mailboxId}`)
    revalidatePath(`/mail/${mailboxId}/config`);
}

export async function editCategory(mailboxId: string, categoryId: string, name: string, color: string | null) {
    const userId = await getCurrentUser()
    if (!userId || !await userMailboxAccess(mailboxId, userId)) {
        throw new Error("Mailbox not found");
    }

    if (color && !categoryColorRegex.test(color)) {
        return { error: "Invalid color" }
    }

    await db.update(MailboxCategory)
        .set({
            name,
            color
        })
        .where(and(
            eq(MailboxCategory.id, categoryId),
            eq(MailboxCategory.mailboxId, mailboxId)
        ))
        .execute()

    revalidateTag(`mailbox-categories-${mailboxId}`)
    revalidatePath(`/mail/${mailboxId}/config`);
}

export async function deleteCategory(mailboxId: string, categoryId: string) {
    const userId = await getCurrentUser()
    if (!userId || !await userMailboxAccess(mailboxId, userId)) {
        throw new Error("Mailbox not found");
    }

    await db.delete(MailboxCategory)
        .where(and(
            eq(MailboxCategory.id, categoryId),
            eq(MailboxCategory.mailboxId, mailboxId)
        ))
        .execute()

    revalidateTag(`mailbox-categories-${mailboxId}`)
    revalidatePath(`/mail/${mailboxId}/config`);
}

export async function addUserToMailbox(mailboxId: string, username: string, role: "ADMIN") {
    const userId = await getCurrentUser()
    if (!userId || !await userMailboxAccess(mailboxId, userId)) {
        throw new Error("Mailbox not found");
    }

    // check if the current user is an admin
    const userRole = await db.query.MailboxForUser.findFirst({
        where: and(
            eq(MailboxForUser.mailboxId, mailboxId),
            eq(MailboxForUser.userId, userId)
        ),
        columns: {
            role: true
        }
    })

    if (userRole?.role !== "OWNER") {
        return { error: "Only owner can add someone to the mailbox" }
    }


    // check how many users are in the mailbox
    const [mailboxUsers, mailbox] = await db.batch([
        db.select({ count: count() })
            .from(MailboxForUser)
            .where(eq(MailboxForUser.mailboxId, mailboxId)),
        db.query.Mailbox.findFirst({
            where: eq(Mailbox.id, mailboxId),
            columns: {
                plan: true
            }
        })
    ])

    if (!mailbox || mailboxUsers[0].count >= mailboxUsersLimit[mailbox.plan]) {
        return { error: "Mailbox users limit reached" }
    }

    // check if user exists
    const proposedUser = await db.query.User.findFirst({
        where: eq(User.username, username),
        columns: {
            id: true
        }
    })

    if (!proposedUser) {
        return { error: `Can't find user "${username}"` }
    }

    // check if they already have access
    if (await userMailboxAccess(mailboxId, proposedUser.id)) {
        return { error: "User already has access to this mailbox" }
    }

    // check how many other mailboxes the user is in
    const userMailboxes = await db.select({ count: count() })
        .from(MailboxForUser)
        .where(eq(MailboxForUser.userId, proposedUser.id))
        .execute()

    // TODO: either make it 5 free mailboxes or somehow make a plan for this
    // (mailboxes having the free plan sounds better then users having pro, but this is harder)
    if (userMailboxes[0].count >= 5) {
        return { error: "User is already in 5 other mailboxes" }
    }

    const validRoles = ["ADMIN"];
    if (!validRoles.includes(role)) {
        return { error: "Invalid role" }
    }

    // add user to mailbox
    await db.insert(MailboxForUser)
        .values({
            mailboxId,
            userId: proposedUser.id,
            role
        })
        .execute()

    revalidateTag(`user-mailbox-access-${mailboxId}-${proposedUser.id}`)
    revalidateTag(`user-mailboxes-${proposedUser.id}`)
    revalidatePath(`/mail/${mailboxId}/config`);
}

export async function removeUserFromMailbox(mailboxId: string, userId: string) {
    const currentUserId = await getCurrentUser()
    if (!currentUserId || !await userMailboxAccess(mailboxId, currentUserId)) {
        throw new Error("Mailbox not found");
    }

    // check if the current user is an admin
    const userRole = await db.query.MailboxForUser.findFirst({
        where: and(
            eq(MailboxForUser.mailboxId, mailboxId),
            eq(MailboxForUser.userId, currentUserId)
        ),
        columns: {
            role: true
        }
    })

    if (userRole?.role !== "OWNER") {
        return { error: "Only owner can remove someone from the mailbox" }
    }

    // check if user exists
    const proposedUser = await db.query.User.findFirst({
        where: eq(User.id, userId),
        columns: {
            id: true
        }
    })

    if (!proposedUser) {
        return { error: `Can't find user with id "${userId}"` }
    }

    // remove user from mailbox
    await db.delete(MailboxForUser)
        .where(and(
            eq(MailboxForUser.mailboxId, mailboxId),
            eq(MailboxForUser.userId, userId),
            not(eq(MailboxForUser.role, "OWNER"))
        ))
        .execute()

    revalidateTag(`user-mailbox-access-${mailboxId}-${userId}`)
    revalidateTag(`user-mailboxes-${userId}`)
    revalidatePath(`/mail/${mailboxId}/config`);
}

export async function leaveMailbox(mailboxId: string) {
    const currentUserId = await getCurrentUser()
    if (!currentUserId) {
        throw new Error("Mailbox not found");
    }

    // check if user exists
    const proposedUser = await db.query.User.findFirst({
        where: eq(User.id, currentUserId),
        columns: {
            id: true
        }
    })

    if (!proposedUser) {
        return { error: `Can't find user with id "${currentUserId}"` }
    }

    // check if they are owner
    const userRole = await db.query.MailboxForUser.findFirst({
        where: and(
            eq(MailboxForUser.mailboxId, mailboxId),
            eq(MailboxForUser.userId, currentUserId)
        ),
        columns: {
            role: true
        }
    })

    if (userRole?.role === "OWNER") {
        return { error: "Owner can't leave the mailbox" }
    }

    // remove user from mailbox
    await db.delete(MailboxForUser)
        .where(and(
            eq(MailboxForUser.mailboxId, mailboxId),
            eq(MailboxForUser.userId, currentUserId),
            not(eq(MailboxForUser.role, "OWNER"))
        ))
        .execute()

    revalidateTag(`user-mailbox-access-${mailboxId}-${currentUserId}`)
    revalidateTag(`user-mailboxes-${currentUserId}`)
    revalidatePath(`/mail/${mailboxId}/config`);
    cookies().delete("mailboxId");
    redirect("/mail");

}
