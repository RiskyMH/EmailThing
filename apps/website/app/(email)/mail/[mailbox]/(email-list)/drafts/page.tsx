import { pageMailboxAccess } from "../../tools"
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
    await pageMailboxAccess(params.mailbox)

    return (
        <EmailList
            mailboxId={params.mailbox}
            type="drafts"
        />
    )
}