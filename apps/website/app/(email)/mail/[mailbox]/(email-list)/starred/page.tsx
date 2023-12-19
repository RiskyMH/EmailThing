import { getCurrentUser } from "@/app/utils/user"
import { notFound } from "next/navigation"
import { getMailbox } from "../../tools"
import { prisma } from "@email/db"
import { Metadata } from "next"
import EmailList from "../email-list"

export const metadata = {
    title: "Starred",
} as Metadata


export default async function Mailbox({
    params,
    searchParams
}: {
    params: {
        mailbox: string
    },
    searchParams?: {
        category?: string
    }
}) {
    const userId = await getCurrentUser()
    const mailbox = await getMailbox(params.mailbox, userId!)
    if (!mailbox) return notFound()

    const emails = await prisma.email.findMany({
        where: {
            mailboxId: mailbox.id,
            isStarred: true,
            category: searchParams?.category ? {
                id: searchParams.category
            } : undefined
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
        },
        orderBy: {
            createdAt: "desc"
        }
    });


    return (
        <EmailList emails={emails} mailbox={mailbox.id} type="starred" />
    )
}