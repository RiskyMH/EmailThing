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
        take?: string
    }
}) {
    await pageMailboxAccess(params.mailbox)

    return (
        <EmailList
            mailboxId={params.mailbox}
            initialTake={searchParams?.take}
            type="starred"
            categoryId={searchParams?.category}
        />
    )
}