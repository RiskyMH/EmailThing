import { getCurrentUser } from "@/app/utils/user"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import Notifications from "./register-button.client"
import { userMailboxAccess } from "../tools"


export const metadata: Metadata = {
    title: "Config",
}


export default async function Email({
    params,
}: {
    params: {
        mailbox: string,
        email: string
    }
}) {
    const userId = await getCurrentUser()
    const userHasAccess = await userMailboxAccess(params.mailbox, userId)
    if (!userHasAccess) return notFound()

    return (
        <div className="min-w-0 p-5">
            <Notifications mailbox={params.mailbox} />
        </div>

    )
}