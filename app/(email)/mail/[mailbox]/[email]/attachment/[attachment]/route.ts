import { getCurrentUser } from "@/utils/jwt"
import { db, EmailAttachments } from "@/db";
import { notFound } from "next/navigation"
import { userMailboxAccess } from "../../../tools"
import { and, eq } from "drizzle-orm";
import { getSignedUrl } from "@/utils/s3";

// export const runtime = 'edge'

export async function GET(
    request: Request,
    {
        params,
    }: {
        params: {
            mailbox: string
            email: string
            attachment: string
        }
    }
) {
    const userId = await getCurrentUser()
    if (!userId || !await userMailboxAccess(params.mailbox, userId)) return notFound();

    const attachment = await db.query.EmailAttachments.findFirst({
        where: and(
            eq(EmailAttachments.id, params.attachment),
            eq(EmailAttachments.emailId, params.email),
        ),
        columns: {
            filename: true,
            id: true
        }
    })
    if (!attachment) return notFound()

    const url = await getSignedUrl({
        key: `${params.mailbox}/${params.email}/${attachment.id}/${attachment.filename}`
    })
    return Response.redirect(url)
}
