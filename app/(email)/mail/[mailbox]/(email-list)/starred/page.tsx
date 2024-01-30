import { pageMailboxAccess } from "../../tools"
import { Metadata } from "next"
import EmailList from "../email-list"

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
    await pageMailboxAccess(params.mailbox)

    return (
        <EmailList
            mailboxId={params.mailbox}
            type="starred"
            categoryId={searchParams?.category}
        />
    )
}