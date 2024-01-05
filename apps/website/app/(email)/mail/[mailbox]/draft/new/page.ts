import { getCurrentUser } from "@/app/utils/user";
import { prisma } from "@email/db";
import { notFound, redirect } from "next/navigation";
import { getMailbox } from "../../tools";


export default async function Page({
    params
}: {
    params: {
        mailbox: string,
    }

}) {
    // make new draft
    const userId = await getCurrentUser()
    const mailbox = await getMailbox(params.mailbox, userId!)

    if (!mailbox) return notFound()

    // create
    const draft = await prisma.draftEmail.create({
        data: {
            mailboxId: mailbox.id,
            from: mailbox.primaryAlias?.alias
        }
    })

    return redirect(`/mail/${params.mailbox}/draft/${draft.id}`)
    
}