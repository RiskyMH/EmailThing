import { getCurrentUser } from "@/utils/jwt"
import { db, DraftEmail } from "@/db";
import { notFound } from "next/navigation"
import { userMailboxAccess } from "../../../tools"
import { and, eq } from "drizzle-orm";
import { makeHtml } from "../tools";

// export const runtime = 'edge'

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

    const mail = await db.query.DraftEmail.findFirst({
        where: and(
            eq(DraftEmail.id, params.draft),
            eq(DraftEmail.mailboxId, params.mailbox),
        ),
        columns: {
            body: true
        }
    })
    if (!mail) return notFound()

    return new Response(makeHtml(mail.body || ""), {
        headers: {
            'Content-Type': 'text/html',
        },
    })

}
