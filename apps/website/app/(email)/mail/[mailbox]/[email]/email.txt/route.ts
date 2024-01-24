import { getCurrentUser } from "@/app/utils/user"
import { prisma } from "@email/db"
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
            body: true
        }
    })
    if (!mail) return notFound()

    return new Response(mail.body)
}
