import { getCurrentUser } from "@/app/utils/user"
import { notFound } from "next/navigation"
import { getMailbox } from "../tools"
import { Metadata } from "next"
import { prisma } from "@email/db"
import { MarkRead } from "./components.client"
import { revalidatePath } from "next/cache"


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
}: {
    params: {
        mailbox: string,
        email: string
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


    return (
        <div className="min-w-0 p-5">
            {!mail.isRead && <MarkRead action={markRead} />}
            <h1 className="font-bold text-3xl">{mail.subject}</h1>
            <p className="whitespace-pre-wrap break-words leading-normal">
                {mail.body}
            </p>
        </div>

    )
}