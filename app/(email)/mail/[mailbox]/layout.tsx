import { getCurrentUser } from "@/utils/jwt"
import { notFound, redirect } from "next/navigation"
import { mailboxAliases, pageMailboxAccess } from "./tools"
import { Metadata } from "next"
import Sidebar from "./sidebar"
import Header from "./header"

export async function generateMetadata({ params }: { params: { mailbox: string } }): Promise<Metadata> {
    await pageMailboxAccess(params.mailbox)

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
    // const userId = await getCurrentUser()
    // if (!userId) return redirect("/login?from=/mail/" + params.mailbox)

    // const userHasAccess = await userMailboxAccess(params.mailbox, userId)
    // if (!userHasAccess) return notFound()

    return (
        <div className="min-h-screen bg-background" vaul-drawer-wrapper="">
            <Header mailbox={params.mailbox} />
            <div className="flex w-screen max-w-full h-[calc(100vh-4.1rem)]">
                <Sidebar mailbox={params.mailbox} className="hidden sm:flex min-h-[calc(100vh-4.1rem)]" />
                <div className="overflow-y-auto w-screen max-w-full h-[calc(100vh-4.1rem)]">
                    {children}
                </div>
            </div>
        </div>
    )
}