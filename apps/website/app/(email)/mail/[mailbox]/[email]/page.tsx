import { getCurrentUser } from "@/app/utils/user"
import { notFound } from "next/navigation"
import { getMailbox } from "../tools"
import { Metadata } from "next"
import { prisma } from "@email/db"
import { MarkRead } from "./components.client"
import { revalidatePath } from "next/cache"
import ParseHTML, { parseHTML } from "./parse-html"
import { marked } from 'marked';
import { TabsList, Tab } from "@/app/components/tabs-link"


const getEmail = async (mailboxId: string, emailId: string, userId: string) => {
    const mailbox = await getMailbox(mailboxId, userId)
    if (!mailbox) return notFound()

    const email = await prisma.email.findUnique({
        where: {
            id: emailId
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
}


export async function generateMetadata(props: { params: { mailbox: string, email: string } }): Promise<Metadata> {
    const userId = await getCurrentUser()
    const mail = await getEmail(props.params.mailbox, props.params.email, userId!)
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
    const userId = await getCurrentUser()
    const mail = await getEmail(params.mailbox, params.email, userId!)
    if (!mail) return notFound()

    async function markRead() {
        "use server"
        const userId = await getCurrentUser()
        if (!userId) throw new Error()

        await prisma.email.update({
            data: {
                isRead: true
            },
            where: {
                id: params.email,
                mailbox: {
                    id: params.mailbox,
                    users: {
                        some: {
                            userId: userId
                        }
                    }
                }
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