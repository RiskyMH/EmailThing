import { Metadata } from "next"
import EmailList from "./email-list"
import { pageMailboxAccess } from "../tools"


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
    await pageMailboxAccess(params.mailbox)

    return (
        <EmailList
            mailboxId={params.mailbox}
            type="inbox"
            categoryId={searchParams?.category}
        />
    )
}