import { getCurrentUser } from "@/app/utils/jwt"
import { prisma } from "@/app/utils/prisma"
import { notFound, redirect } from "next/navigation"
import { parseHTML } from "../parse-html"
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
