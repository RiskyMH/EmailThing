import { getCurrentUser } from "@/app/utils/user"
import { notFound } from "next/navigation"
import { getMailbox } from "../../tools"
import { Metadata } from "next"
import EmailList from "../email-list"
import { getEmailList } from "../tools"

export const metadata = {
    title: "Starred",
} as Metadata


export default async function Mailbox({
    params,
    searchParams
}: {
    params: {
        mailbox: string
    },
    searchParams?: {
        category?: string
    }
}) {
    const userId = await getCurrentUser()
    const mailbox = await getMailbox(params.mailbox, userId!)
    if (!mailbox) return notFound()

    return (
        <EmailList
            mailboxId={mailbox.id}
            type="starred"
            categoryId={searchParams?.category}
        />
    )
}