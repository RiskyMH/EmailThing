import { Metadata } from "next"
import Notifications from "../../../../(auth)/settings/notifications.client"
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
            Config here
        </div>

    )
}