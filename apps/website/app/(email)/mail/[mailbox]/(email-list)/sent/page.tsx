import { getCurrentUser } from "@/app/utils/user"
import { notFound } from "next/navigation"
import { getMailbox } from "../../tools"
import { prisma } from "@email/db"
import { Metadata } from "next"
import EmailList from "../email-list"
import { getEmailList } from "../tools"

export const metadata = {
    title: "Sent",
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
    
    console.time("emailfetch")
    const [emails, categories, allCount] = await getEmailList(mailbox.id, userId!, { categoryId: searchParams?.category, isBinned: false, isSender: true })
    console.timeEnd("emailfetch")

    return (
        <EmailList emails={emails} mailbox={mailbox.id} categories={categories} emailCount={allCount} type="sent" />
    )
}