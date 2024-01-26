import { getCurrentUser } from "@/app/utils/jwt";
import { prisma } from "@email/db";
import { notFound, redirect } from "next/navigation";
import { mailboxAliases, pageMailboxAccess } from "../../tools";


export default async function Page({
    params,
    searchParams
}: {
    params: {
        mailbox: string,
    },
    searchParams: {
        reply?: string,
        replyAll?: string,
        forward?: string,
    }
}) {
    // make new draft
    await pageMailboxAccess(params.mailbox)

    const { aliases, default: defaultAlias } = await mailboxAliases(params.mailbox)

    if (searchParams.reply || searchParams.replyAll || searchParams.forward) {
        const email = await prisma.email.findUnique({
            where: {
                id: searchParams.reply || searchParams.replyAll || searchParams.forward,
                mailboxId: params.mailbox,
            },
            select: {
                id: true,
                subject: true,
                body: true,
                createdAt: true,
                recipients: {
                    select: {
                        address: true,
                        name: true,
                        cc: true
                    }
                },
                from: {
                    select: {
                        name: true,
                        address: true
                    }
                }

            }
        })

        if (!email) return notFound()

        const aliasesList = aliases.map(a => a.alias)
        const from = email.recipients.find(r => aliasesList.includes(r.address))?.address || defaultAlias?.alias

        let subject = email.subject
        let to = '[]'

        if (searchParams.reply) {
            if (!subject?.startsWith("Re: ")) {
                subject = `Re: ${subject}`
            }
            to = JSON.stringify([{ name: email.from?.name, address: email.from?.address, cc: null }])

        } else if (searchParams.replyAll) {
            if (!subject?.startsWith("Re: ")) {
                subject = `Re: ${subject}`
            }
            to = JSON.stringify([
                { name: email.from?.name, address: email.from?.address, cc: null },
                ...email.recipients.map(r => ({ name: r.name, address: r.address, cc: r.cc ? "cc" : null })),
            ].filter(r => r.address !== from))

        } else if (searchParams.forward) {
            if (!subject?.startsWith("Fwd: ")) {
                subject = `Fwd: ${subject}`
            }
        }

        const emailBody = `On ${email.createdAt.toLocaleString()}, ${email.from?.name ? `${email.from?.name} <${email.from?.address}>` : email.from?.name} wrote:\n\n> ${email.body.split("\n").join("\n> ")}`

        // create draft with reply
        const draft = await prisma.draftEmail.create({
            data: {
                mailboxId: params.mailbox,
                from,
                body: emailBody,
                subject,
                to
            }
        })

        return redirect(`/mail/${params.mailbox}/draft/${draft.id}`)
    }


    // create basic draft
    const draft = await prisma.draftEmail.create({
        data: {
            mailboxId: params.mailbox,
            from: defaultAlias?.alias
        }
    })

    return redirect(`/mail/${params.mailbox}/draft/${draft.id}`)

}