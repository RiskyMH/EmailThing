import { getCurrentUser } from "@/app/utils/user"
import { prisma } from "@email/db"
import { notFound, redirect } from "next/navigation"
import { parseHTML } from "../parse-html"


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
            html: true
        }
    })
    if (!mail) return notFound()

    if (!mail.html) {
        return redirect(`/mail/${params.mailbox}/${params.email}/email.txt`)
    }

    // return new Response(await parseHTML(mail.html), {
    return new Response((mail.html), {
        headers: {
            'Content-Type': 'text/html',
        },
    })

}
