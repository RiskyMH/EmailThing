import { getCurrentUser } from "@/app/utils/jwt"
import { prisma } from "@/app/utils/prisma"
import { notFound } from "next/navigation"
import { userMailboxAccess } from "../../tools"


export async function GET(
    request: Request,
    {
        params,
    }: {
        params: {
            mailbox: string
            email: string
        }
    }
) {
    const userId = await getCurrentUser()
    if (!userId || !await userMailboxAccess(params.mailbox, userId)) return notFound();

    const mail = await prisma.email.findFirst({
        where: {
            id: params.email,
            mailboxId: params.mailbox,
        }, 
        select: {
            raw: true
        }
    })
    if (!mail) return notFound()

    return new Response(mail.raw)
}
