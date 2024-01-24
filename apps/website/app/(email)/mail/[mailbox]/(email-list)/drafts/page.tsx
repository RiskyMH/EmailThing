import { getCurrentUser } from "@/app/utils/user"
import { notFound } from "next/navigation"
import { userMailboxAccess } from "../../tools"
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
    const userHasAccess = await userMailboxAccess(params.mailbox, userId)
    if (!userHasAccess) return notFound()

    return (
        <EmailList
            mailboxId={params.mailbox}
            type="drafts"
        />
    )
}