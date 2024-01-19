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

        // now send email (via mailchannels)!
        const e = await fetch("https://email.riskymh.workers.dev", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-auth": env.EMAIL_AUTH_TOKEN
            },
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