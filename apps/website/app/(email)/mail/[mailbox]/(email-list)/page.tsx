import { getCurrentUser } from "@/app/utils/user"
import { notFound } from "next/navigation"
import { getMailbox } from "../tools"
import { Metadata } from "next"
import EmailList from "./email-list"


export const metadata = {
    title: "Inbox",
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
            type="inbox"
            categoryId={searchParams?.category}
        />
    )
}