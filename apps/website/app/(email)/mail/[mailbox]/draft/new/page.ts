import { getCurrentUser } from "@/app/utils/user";
import { prisma } from "@email/db";
import { notFound, redirect } from "next/navigation";
import { mailboxAliases, userMailboxAccess } from "../../tools";


export default async function Page({
    params
}: {
    params: {
        mailbox: string,
    }

}) {
    // make new draft
    const userId = await getCurrentUser()
    const userHasAccess = await userMailboxAccess(params.mailbox, userId)
    if (!userHasAccess) return notFound()

    const aliases = await mailboxAliases(params.mailbox)

    // create
    const draft = await prisma.draftEmail.create({
        data: {
            mailboxId: params.mailbox,
            from: aliases.default?.alias
        }
    })

    return redirect(`/mail/${params.mailbox}/draft/${draft.id}`)
    
}