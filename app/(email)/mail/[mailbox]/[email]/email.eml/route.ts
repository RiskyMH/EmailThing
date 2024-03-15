import { getCurrentUser } from "@/utils/jwt"
import { prisma } from "@/utils/prisma"
import { notFound } from "next/navigation"
import { userMailboxAccess } from "../../tools"
import { env } from "@/utils/env"
import { S3, S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";


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
            raw: true
        }
    })
    if (!mail) return notFound()

    if (mail.raw === "Saved in s3" && env.S3_KEY_ID && env.S3_SECRET_ACCESS_KEY && env.S3_URL) {
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
    }

    return new Response(mail.raw)
}
