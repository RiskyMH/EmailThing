import { getCurrentUser } from "@/app/utils/user"
import { notFound } from "next/navigation"
import { getMailbox } from "../tools"
import { Metadata } from "next"
import dynamic from "next/dynamic"
import Notifications from "./register-button.client"


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
    const mail = await getMailbox(params.mailbox, userId!)
    if (!mail) return notFound()


    return (
        <div className="min-w-0 p-5">
            <Notifications mailbox={params.mailbox} />
        </div>

    )
}