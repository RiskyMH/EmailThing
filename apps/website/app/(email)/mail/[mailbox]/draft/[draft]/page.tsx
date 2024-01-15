import { prisma } from "@email/db"
import { BodyEditor, FromInput, RecipientInput, SendButton, Subject } from "./editor.client"
import { getCurrentUser } from "@/app/utils/user"
import { notFound, redirect } from "next/navigation"
import { getMailbox } from "../../tools"
import { env } from "@/app/utils/env"
import { revalidatePath } from "next/cache"

// TODO: actually put title
export const metadata = {
    title: "Drafts",
}


export default async function DraftPage({
    params
}: {
    params: {
        mailbox: string,
        draft: string
    }

}) {
    const userId = await getCurrentUser()
    const mailbox = await getMailbox(params.mailbox, userId!)
    if (!mailbox) return notFound()

    const mail = await prisma.draftEmail.findFirst({
        where: {
            id: params.draft,
            mailboxId: params.mailbox,
        },
        select: {
            body: true,
            subject: true,
            from: true,
            to: true
        }
    })
    if (!mail) return notFound()

    const aliases = await prisma.mailboxAlias.findMany({
        where: {
            mailboxId: params.mailbox
        },
        select: {
            name: true,
            alias: true
        }
    });

    interface Recipient {
        name: string | null,
        address: string,
        cc?: "cc" | "bcc" | null,
    }

    interface SaveActionProps {
        body?: string,
        subject?: string,
        from?: string,
        to?: Recipient[]
    }

    async function saveAction(data: SaveActionProps) {
        'use server';

        await prisma.draftEmail.update({
            where: {
                id: params.draft,
                mailbox: {
                    id: params.mailbox,
                    users: {
                        some: {
                            userId: userId!
                        }
                    }
                }
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

        revalidatePath(`/mail/${params.mailbox}/draft/${params.draft}`)
    };

    const sendAction = async () => {
        "use server";

        const mail = await prisma.draftEmail.findFirst({
            where: {
                id: params.draft,
                mailboxId: params.mailbox,
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
                mailboxId: params.mailbox,
                alias: from!,
                mailbox: {
                    users: {
                        some: {
                            userId: userId!
                        }
                    }
                }
            },
            select: {
                name: true,
                alias: true
            }
        })
        if (!alias) throw new Error("Alias not found")

        // check if domain is a default one and get its dkim_private_key
        let domainSettings = {
            dkimPrivateKey: null as string | null,
            dkimSelector: null as string | null,
            dkimDomain: null as string | null,
            authKey: null as string | null,
            emailSendUrl: null as string | null,
        }
        const defaultDomain = await prisma.mailboxDefaultDomain.findFirst({
            where: {
                domain: alias.alias.split("@")[1]
            },
            select: {
                authKey: true,
                domain: true,
                dkimPrivateKey: true,
            }
        })

        if (defaultDomain) {
            domainSettings = {
                dkimPrivateKey: defaultDomain.dkimPrivateKey,
                dkimSelector: "emailthing",
                dkimDomain: defaultDomain.domain,
                authKey: defaultDomain.authKey,
                emailSendUrl: "https://email.riskymh.workers.dev"
            }
        } else {
            const customDomain = await prisma.mailboxCustomDomain.findFirst({
                where: {
                    mailboxId: params.mailbox,
                    domain: alias.alias.split("@")[1]
                },
                select: {
                    authKey: true,
                    dkimDomain: true,
                    dkimPrivateKey: true,
                    dkimSelector: true,
                    emailSendUrl: true,
                }
            })
            if (customDomain) {
                domainSettings = customDomain
            } else {
                throw new Error("Alias domain not found")
            }
        }
        if (!domainSettings.authKey || !domainSettings.emailSendUrl) throw new Error("Domain settings not found");

        const b = {
            personalizations: [
                {
                    to: to!.filter(({ cc }) => cc !== "cc" && cc !== "bcc").map(({ address, name }) => ({ email: address, name: name || undefined })),
                    cc: to!.filter(({ cc }) => cc === "cc").map(({ address, name }) => ({ email: address, name: name || undefined })),
                    bcc: to!.filter(({ cc }) => cc === "bcc").map(({ address, name }) => ({ email: address, name: name || undefined })),
                },
            ] as Record<string, any>[],
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
        }

        // add dkim signature
        if (domainSettings.dkimPrivateKey && domainSettings.dkimSelector && domainSettings.dkimDomain) {
            b.personalizations.push({
                dkim_domain: domainSettings.dkimDomain,
                dkim_private_key: domainSettings.dkimPrivateKey,
                dkim_selector: domainSettings.dkimSelector,
            })
        }

        // now send email (via mailchannels)!
        const e = await fetch(domainSettings.emailSendUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-auth": domainSettings.authKey
            },
            body: JSON.stringify(b),
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
                            id: params.mailbox
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
                    id: params.draft
                },
                select: {
                    id: true
                }
            })
        ])

        redirect(`/mail/${params.mailbox}`)
    }

    const to = mail.to ? JSON.parse(mail.to) as Recipient[] : undefined

    let isValid = null;
    if (!mail.subject) {
        isValid = "Subject is required";
    } else if (!mail.body) {
        isValid = "Body is required";
    } else if (!mail.from) {
        isValid = "From is required";
    } else if (!to || [...to].filter(e => !e.cc).length <= 0) {
        isValid = "At least one recipient is required";
    }

    return (
        <div className="w-full p-4 md:p-8 gap-4 flex flex-col">
            <div className="flex items-center gap-4">
                <SendButton sendAction={sendAction} isValid={isValid} />
                <FromInput savedAlias={mail.from || mailbox.primaryAlias?.alias} aliases={aliases} saveAction={saveAction} />
            </div>

            <RecipientInput savedTo={to} saveAction={saveAction} />
            <Subject savedSubject={mail.subject ?? undefined} saveAction={saveAction} />
            <br className="h-4" />
            <BodyEditor savedBody={mail.body ?? undefined} saveAction={saveAction} />
        </div>
    )
}