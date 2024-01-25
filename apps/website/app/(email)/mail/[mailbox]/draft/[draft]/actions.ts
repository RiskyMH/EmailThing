"use server";

import { prisma } from "@email/db";
import { redirect } from "next/navigation";
import { env } from "process";
import { userMailboxAccess } from "../../tools";
import { getCurrentUser } from "@/app/utils/user";
import { revalidatePath } from "next/cache";
import { SaveActionProps, Recipient } from "./types";

export async function sendEmailAction(mailboxId: string, draftId: string) {
    const userId = await getCurrentUser()
    if (!userId || !await userMailboxAccess(mailboxId, userId)) {
        throw new Error("Mailbox not found");
    }

    const mail = await prisma.draftEmail.findFirst({
        where: {
            id: draftId,
            mailboxId: mailboxId,
        },
        select: {
            body: true,
            subject: true,
            from: true,
            to: true,
        }
    })
    if (!mail) throw new Error("Mail not found")

    const { body, subject, from, to: toString } = mail
    const to = toString ? JSON.parse(toString) as Recipient[] : null
    if (!to) throw new Error("No recipients")

    // verify alias is valid (and user has access to it)
    const alias = await prisma.mailboxAlias.findFirst({
        where: {
            mailboxId: mailboxId,
            alias: from!
        },
        select: {
            name: true,
            alias: true
        }
    })
    if (!alias) throw new Error("Alias not found")

    // now send email (via mailchannels)!
    const e = await fetch("https://email.riskymh.workers.dev", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-auth": env.EMAIL_AUTH_TOKEN
        } as Record<string, string>,
        body: JSON.stringify({
            personalizations: [
                {
                    to: to!.filter(({ cc }) => cc !== "cc" && cc !== "bcc").map(({ address, name }) => ({ email: address, name: name || undefined })),
                    cc: to!.filter(({ cc }) => cc === "cc").map(({ address, name }) => ({ email: address, name: name || undefined })),
                    bcc: to!.filter(({ cc }) => cc === "bcc").map(({ address, name }) => ({ email: address, name: name || undefined })),
                    ...(env.EMAIL_DKIM_PRIVATE_KEY ? ({
                        dkim_domain: "emailthing.xyz",
                        dkim_private_key: env.EMAIL_DKIM_PRIVATE_KEY,
                        dkim_selector: "emailthing",
                    }) : []),
                },
            ],
            from: {
                email: alias.alias,
                name: alias.name ?? undefined
            },
            subject: subject || "(no subject)",
            content: [
                body ? ({
                    type: "text/plain",
                    value: body
                }) : undefined,
            ]
        }),
    })

    if (!e.ok) {
        console.error(await e.text())
        throw new Error("Failed to send email")
    }

    // add to sent folder
    await Promise.all([
        prisma.email.create({
            data: {
                body: body ?? "",
                subject,
                snippet: body ? (body.slice(0, 200) + (200 < body.length ? '…' : '')) : '',
                from: {
                    create: {
                        name: alias.name ?? undefined,
                        address: alias.alias
                    }
                },
                recipients: {
                    createMany: {
                        data: to!.map(({ address, name, cc }) => ({
                            name: name ?? undefined,
                            address,
                            cc: !!cc ?? undefined
                        }))
                    }
                },
                // todo: proper 
                raw: "CREATED IN DRAFTS",
                mailbox: {
                    connect: {
                        id: mailboxId
                    }
                },
                isRead: true,
                isSender: true,
            },
            select: {
                id: true
            }

        }),

        // delete draft
        prisma.draftEmail.delete({
            where: {
                id: draftId
            },
            select: {
                id: true
            }
        })
    ])

    redirect(`/mail/${mailboxId}`)
}


export async function saveDraftAction(mailboxId: string, draftId: string, data: SaveActionProps) {
    const userId = await getCurrentUser()
    if (!userId || !await userMailboxAccess(mailboxId, userId)) {
        throw new Error("Mailbox not found");
    }

    await prisma.draftEmail.update({
        where: {
            id: draftId,
            mailboxId,
        },
        data: {
            body: data.body,
            subject: data.subject,
            from: data.from,
            to: data.to ? JSON.stringify(data.to.map(({ name, address, cc }) => ({ name, address, cc }))) : undefined
        },
        select: {
            id: true
        }
    })

    revalidatePath(`/mail/${mailboxId}/draft/${draftId}`)
};
