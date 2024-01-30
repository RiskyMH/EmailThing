import { Metadata } from "next"
import Notifications from "./register-button.client"
import { pageMailboxAccess } from "../tools"


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
    await pageMailboxAccess(params.mailbox)

    return (
        <div className="min-w-0 p-5">
            <Notifications mailbox={params.mailbox} />
        </div>

    )
}