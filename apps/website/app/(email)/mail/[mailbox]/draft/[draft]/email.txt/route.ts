import { getCurrentUser } from "@/app/utils/user"
import { prisma } from "@email/db"
import { notFound } from "next/navigation"


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
    const mail = await prisma.draftEmail.findFirst({
        where: {
            id: params.draft,
            mailbox: {
                id: params.mailbox,
                users: {
                    some: {
                        userId: userId!
                    }
                }
            }
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
