import { getCurrentUser } from "@/utils/jwt"
import { db, Email } from "@/db";
import { notFound, redirect } from "next/navigation"
import { userMailboxAccess } from "../../tools"
import { and, eq } from "drizzle-orm";

// export const runtime = 'edge'

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

    const mail = await db.query.Email.findFirst({
        where: and(
            eq(Email.id, params.email),
            eq(Email.mailboxId, params.mailbox),
        ),
        columns: {
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
