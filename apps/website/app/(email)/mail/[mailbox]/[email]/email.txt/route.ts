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
            email: string
        }
    }
) {
    const userId = await getCurrentUser()
    const mail = await prisma.email.findFirst({
        where: {
            id: params.email,
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

    return new Response(mail.body)
}
