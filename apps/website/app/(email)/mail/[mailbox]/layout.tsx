import { getCurrentUser } from "@/app/utils/user"
import { notFound, redirect } from "next/navigation"
import { userMailboxAccess, mailboxAliases } from "./tools"
import { Metadata } from "next"
import Sidebar from "./sidebar"
import Header from "./header"

export async function generateMetadata({ params }: { params: { mailbox: string } }): Promise<Metadata> {
    const userId = await getCurrentUser()
    const userHasAccess = await userMailboxAccess(params.mailbox, userId)
    if (!userHasAccess) return notFound()

    const { default: defaultAlias } = await mailboxAliases(params.mailbox)

    return {
        title: {
            default: `${defaultAlias?.alias}`,
            template: `%s - ${defaultAlias?.alias} - EmailThing`,
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

    const userHasAccess = await userMailboxAccess(params.mailbox, userId)
    if (!userHasAccess) return notFound()

    return (
        <div className="min-h-screen bg-background" vaul-drawer-wrapper="">
            <Header mailbox={params.mailbox} />
            <div className="flex w-screen max-w-full">
                <Sidebar mailbox={params.mailbox} className="hidden sm:inline" />
                {children}
            </div>
        </div>
    )
}