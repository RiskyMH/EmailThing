import { getCurrentUser } from "@/utils/jwt"
import { db, Email } from "@/db";
import { notFound } from "next/navigation"
import { userMailboxAccess } from "../../tools"
import { env } from "@/utils/env"
import { S3, S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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
            raw: true
        }
    })
    if (!mail) return notFound()

    if (mail.raw === "s3") {
        const url = await getSignedUrl(
            new S3Client({
                credentials: {
                    accessKeyId: env.S3_KEY_ID,
                    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
                },
                endpoint: env.S3_URL,
                region: "auto"
            }),
            new GetObjectCommand({
                Bucket: "email",
                Key: `${params.mailbox}/${params.email}/email.eml`,
                ResponseContentType: "text/plain"
            }),
            { expiresIn: 3600 }
        );

        return Response.redirect(url)
    } else if (mail.raw === "draft") {
        return new Response("This email was made from drafts.")
    }

    return new Response(mail.raw)
}
