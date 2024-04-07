import { db, DraftEmail } from "@/db";
import { notFound, redirect } from "next/navigation";
import { mailboxAliases, pageMailboxAccess } from "../../tools";
import { and, eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import type { Recipient } from "../[draft]/types";
import { headers } from "next/headers";

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
        const email = await db.query.Email.findFirst({
            where: and(
                eq(DraftEmail.id, searchParams.reply || searchParams.replyAll || searchParams.forward || ''),
                eq(DraftEmail.mailboxId, params.mailbox),
            ),
            columns: {
                id: true,
                subject: true,
                body: true,
                createdAt: true,
                replyTo: true,
            },
            with: {
                recipients: {
                    columns: {
                        address: true,
                        name: true,
                        cc: true
                    }
                },
                from: {
                    columns: {
                        name: true,
                        address: true
                    }
                },
            }
        })

        if (!email) return notFound()

        const aliasesList = aliases.map(a => a.alias)
        const from = email.recipients.find(r => aliasesList.includes(r.address))?.address || defaultAlias?.alias

        let subject = email.subject
        let to = [] as Recipient[]

        const replyTo = email.replyTo ? { address: email.replyTo, name: null } : email.from

        if (searchParams.reply) {
            if (!subject?.startsWith("Re: ")) {
                subject = `Re: ${subject}`
            }
            to = [{ name: replyTo?.name, address: replyTo?.address, cc: null }]

        } else if (searchParams.replyAll) {
            if (!subject?.startsWith("Re: ")) {
                subject = `Re: ${subject}`
            }
            to = [
                { name: replyTo?.name, address: replyTo?.address, cc: null },
                ...email.recipients.map(r => ({ name: r.name, address: r.address, cc: (r.cc ? "cc" : null) as "cc" | null })),
            ].filter(r => r.address !== from)

        } else if (searchParams.forward) {
            if (!subject?.startsWith("Fwd: ")) {
                subject = `Fwd: ${subject}`
            }
        }

        const timeZone = headers().get("x-vercel-ip-timezone") || undefined
        const emailBody = `\n\nOn ${email.createdAt.toLocaleString([], { timeZone })}, ${email.from?.name ? `${email.from?.name} <${email.from?.address}>` : email.from?.name} wrote:\n\n> ${email.body.split("\n").join("\n> ")}`

        // create draft with reply
        const draftId = createId()
        await db.insert(DraftEmail)
            .values({
                id: draftId,
                mailboxId: params.mailbox,
                from,
                body: emailBody,
                subject,
                to
            })
            .execute()

        return redirect(`/mail/${params.mailbox}/draft/${draftId}`)
    }

    // create basic draft
    const draftId = createId()
    await db.insert(DraftEmail)
        .values({
            id: draftId,
            mailboxId: params.mailbox,
            from: defaultAlias?.alias
        })
        .execute()

    return redirect(`/mail/${params.mailbox}/draft/${draftId}`)

}