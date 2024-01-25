import { getCurrentUser } from "@/app/utils/user"
import { notFound } from "next/navigation"
import { pageMailboxAccess, userMailboxAccess } from "../tools"
import { Metadata } from "next"
import { prisma } from "@email/db"
import { MarkRead } from "./components.client"
import { revalidatePath } from "next/cache"
import ParseHTML, { parseHTML } from "./parse-html"
import { marked } from 'marked';
import { TabsList, Tab } from "@/app/components/tabs-link"
import { cache } from "react"


const getEmail = cache(async (mailboxId: string, emailId: string) => {

    const email = await prisma.email.findUnique({
        where: {
            id: emailId,
            mailboxId
        },
        select: {
            id: true,
            subject: true,
            snippet: true,
            body: true,
            html: true,
            createdAt: true,
            isRead: true,
            isStarred: true,
            recipients: {
                select: {
                    address: true,
                    name: true,
                    cc: true
                }
            },
            category: {
                select: {
                    name: true,
                    id: true,
                    color: true
                }
            },
            from: {
                select: {
                    name: true,
                    address: true
                }
            }
        }
    })

    return email
})


export async function generateMetadata(props: { params: { mailbox: string, email: string } }): Promise<Metadata> {
    await pageMailboxAccess(props.params.mailbox)
    const mail = await getEmail(props.params.mailbox, props.params.email)
    if (!mail) return notFound()

    return {
        title: mail.subject,
    }
}

export default async function Email({
    params,
    searchParams
}: {
    params: {
        mailbox: string,
        email: string
    },
    searchParams: {
        view?: "text" | "markdown" | "html"
    }
}) {
    await pageMailboxAccess(params.mailbox)
    const mail = await getEmail(params.mailbox, params.email)
    if (!mail) return notFound()

    async function markRead() {
        "use server"
        const userId = await getCurrentUser()
        if (!userId || !await userMailboxAccess(params.mailbox, userId))
            return "No access to mailbox";

        await prisma.email.update({
            data: {
                isRead: true
            },
            where: {
                id: params.email,
                mailboxId: params.mailbox,
            }

        });

        revalidatePath(`/mail/${params.mailbox}/${params.email}`)

    }

    const view = searchParams?.view || "markdown"


    return (
        <div className="min-w-0 p-5 w-full h-full space-y-2">
            {!mail.isRead && <MarkRead action={markRead} />}
            <h1 className="font-bold text-3xl break-words">{mail.subject}</h1>
            <TabsList>
                <Tab title="Text" href={`/mail/${params.mailbox}/${params.email}?view=text`} active={view === "text"} />
                <Tab title="Markdown" href={`/mail/${params.mailbox}/${params.email}?view=markdown`} active={view === "markdown"} />
                <Tab title="HTML" href={`/mail/${params.mailbox}/${params.email}?view=html`} active={view === "html"} disabled={!mail.html} />
            </TabsList>
            {view === "text" ? <p className="whitespace-pre-wrap break-words leading-normal">{mail.body}</p> : null}
            {view === "markdown" ? <ParseHTML className="prose dark:prose-invert max-w-full break-words" body={await marked.parse(mail.body, { breaks: true })} /> : null}
            {/* {view === "html" ? <ParseHTML className="rounded-lg" body={mail.html || mail.body} /> : null} */}
            {view === "html" ? <iframe className="rounded-lg w-full h-screen bg-card" sandbox='allow-popups' srcDoc={await parseHTML(mail.html || mail.body, true)} /> : null}
        </div>

    )
}