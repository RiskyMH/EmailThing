import { getCurrentUser } from "@/app/utils/user"
import { notFound, redirect } from "next/navigation"
import { getMailbox } from "./tools"
import { Metadata } from "next"
import Sidebar from "./sidebar"

export async function generateMetadata(props: { params: { mailbox: string } }): Promise<Metadata> {
    const userId = await getCurrentUser()
    const mailbox = await getMailbox(props.params.mailbox, userId!)
    if (!mailbox) return notFound()

    return {
        title: {
            default: `${mailbox.primaryAlias?.alias}`,
            template: `%s - ${mailbox.primaryAlias?.alias} - EmailThing`,
        },
        robots: "noindex",
    }
}



export default async function MailLayout({
    children,
    params,
}: {
    children: React.ReactNode,
    params: {
        mailbox: string
    }
}) {
    const userId = await getCurrentUser()
    if (!userId) return redirect("/login?from=/mail/" + params.mailbox)

    const mailbox = await getMailbox(params.mailbox, userId)
    if (!mailbox) return notFound()

    return (
        <div className="flex w-screen max-w-full">
            <Sidebar mailbox={mailbox.id} />
            {children}
        </div>
    )
}