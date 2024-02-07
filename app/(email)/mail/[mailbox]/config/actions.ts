'use server';

import { getCurrentUser } from "@/utils/jwt";
import { userMailboxAccess } from "../tools";
import prisma from "@/utils/prisma";
import { aliasLimit, customDomainLimit } from "@/utils/limits";
import { revalidatePath } from "next/cache";
import { emailSchema } from "@/validations/auth";
import { createId } from '@paralleldrive/cuid2';

export async function verifyDomain(mailboxId: string, customDomain: string) {
    const userId = await getCurrentUser()
    if (!userId || !await userMailboxAccess(mailboxId, userId)) {
        throw new Error("Mailbox not found");
    }

    // check if mailbox plan allows for more than 1 custom domain
    const [mailbox, customDomains, exists] = await Promise.all([
        prisma.mailbox.findUnique({
            where: {
                id: mailboxId
            },
            select: {
                plan: true,
            },
        }),

        prisma.mailboxCustomDomain.count({
            where: {
                mailboxId
            }
        }),

        prisma.mailboxCustomDomain.findFirst({
            where: {
                domain: customDomain,
                mailboxId,
            }, 
            select: {
                id: true,
            }
        })
    ]);

    if (!mailbox) {
        throw new Error("Mailbox not found");
    }

    if ((customDomainLimit as any)[mailbox.plan] <= customDomains) {
        return { error: "Custom domain limit reached" }
    }

    if (!customDomain) {
        throw new Error("Custom domain not found");
    }


    if (exists) {
        console.log(exists)
        return { error: "You have already verified this domain" }
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
    await prisma.mailboxCustomDomain.create({
        data: {
            domain: customDomain,
            mailboxId,
            authKey: createId(),
        }
    })    

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
    const existingAlias = await prisma.mailboxAlias.findFirst({
        where: {
            alias
        }
    })

    if (existingAlias) {
        return { error: "Alias already exists" }
    }

    // check if domain is a custom domain (and they have access to it) or just a default domain
    const [defaultDomain, customDomain, aliasCount, mailbox] = await Promise.all([
        prisma.mailboxDefaultDomain.findFirst({
            where: {
                domain: alias.split("@")[1],
            }
        }),

        prisma.mailboxCustomDomain.findFirst({
            where: {
                domain: alias.split("@")[1],
                mailboxId,
            }
        }),

        prisma.mailboxAlias.count({
            where: {
                mailboxId
            }
        }),

        prisma.mailbox.findUnique({
            where: {
                id: mailboxId
            },
            select: {
                plan: true
            }
        })
    ])

    if (!defaultDomain && !customDomain) {
        return { error: "You don't have access to this domain, please add it as custom domain." }
    }

    if (aliasCount >= (aliasLimit as any)[mailbox?.plan ?? "FREE"]) {
        return { error: "Alias limit reached" }
    }

    // add alias
    await prisma.mailboxAlias.create({
        data: {
            mailboxId,
            alias,
            name
        }
    })

    return revalidatePath(`/mail/${mailboxId}/config`);
}