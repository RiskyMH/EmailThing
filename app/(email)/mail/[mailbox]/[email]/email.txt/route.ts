import { getCurrentUser } from "@/utils/jwt"
import { db, Email } from "@/db";
import { notFound } from "next/navigation"
import { userMailboxAccess } from "../../tools"
import { and, eq } from "drizzle-orm";


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
            body: true
        }
    })
    if (!mail) return notFound()

    return new Response(mail.body)
}
