import { getCurrentUser } from "@/app/utils/user"
import { notFound } from "next/navigation"
import { getMailbox } from "../../tools"
import { prisma } from "@email/db"
import { Metadata } from "next"
import EmailList from "../email-list"

export const metadata = {
    title: "Drafts",
} as Metadata


export default async function Mailbox({
    params,
}: {
    params: {
        mailbox: string
    }
}) {
    const userId = await getCurrentUser()
    const mailbox = await getMailbox(params.mailbox, userId!)
    if (!mailbox) return notFound()

    const emails = await prisma.draftEmail.findMany({
        where: {
            mailboxId: mailbox.id,
        },
        select: {
            id: true,
            subject: true,
            body: true,
            updatedAt: true,
            from: true,
        },
        orderBy: {
            updatedAt: "desc"
        }
    });

    const emailsFormatted = emails.map(email => ({
        ...email,
        snippet: email.body,
        createdAt: email.updatedAt,
        isStarred: null,
        isRead: null,
        from: null,
        draft: true,
        binnedAt: null,
    }))

    const allCount = await prisma.draftEmail.count({
        where: {
            mailboxId: mailbox.id,
        }
    })

    return (
        <EmailList emails={emailsFormatted} mailbox={mailbox.id} emailCount={allCount} type="drafts" />
    )
}