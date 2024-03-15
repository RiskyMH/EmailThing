import { getCurrentUser } from "@/utils/jwt"
import { prisma } from "@/utils/prisma"
import { notFound } from "next/navigation"
import { userMailboxAccess } from "../../../tools"
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
            attachment: string
        }
    }
) {
    const userId = await getCurrentUser()
    if (!userId || !await userMailboxAccess(params.mailbox, userId)) return notFound();

    if (!env.S3_KEY_ID || !env.S3_SECRET_ACCESS_KEY || !env.S3_URL) return notFound()

    const attachment = await prisma.emailAttachment.findFirst({
        where: {
            id: params.attachment,
            emailId: params.email,
        },
        select: {
            filename: true,
            id: true
        }
    })
    if (!attachment) return notFound()

    const s3 = new S3Client({
        credentials: {
            accessKeyId: env.S3_KEY_ID,
            secretAccessKey: env.S3_SECRET_ACCESS_KEY,
        },
        endpoint: env.S3_URL,
        region: "auto"
    })

    const url = await getSignedUrl(s3, new GetObjectCommand({
        Bucket: "email",
        Key: `${params.mailbox}/${params.email}/${attachment.id}/${attachment.filename}`,
    }), { expiresIn: 3600 });

    return Response.redirect(url)
}
