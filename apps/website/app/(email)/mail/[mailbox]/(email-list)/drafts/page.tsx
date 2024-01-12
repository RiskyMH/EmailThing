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

    return (
        <EmailList
            mailboxId={mailbox.id}
            type="drafts"
        />
    )
}