import { getCurrentUser } from "@/app/utils/jwt"
import { prisma } from "@/app/utils/prisma"
import { notFound } from "next/navigation"
import { userMailboxAccess } from "../../../tools"


export async function GET(
    request: Request,
    {
        params,
    }: {
        params: {
            mailbox: string
            draft: string
        }
    }
) {
    const userId = await getCurrentUser()
    if (!userId || !await userMailboxAccess(params.mailbox, userId)) return notFound();

    const mail = await prisma.draftEmail.findFirst({
        where: {
            id: params.draft,
            mailboxId: params.mailbox,
        },
        select: {
            body: true
        }
    })
    if (!mail) return notFound()

    return new Response(mail.body, {
        headers: {
            'Content-Type': 'text/plain',
        },
    })

}
