import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "./env";
import { getSignedUrl as awsGetSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3 = new S3Client({
    credentials: {
        accessKeyId: env.S3_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
    endpoint: env.S3_URL,
    region: "auto"
})

export function getSignedUrl({ key, responseContentType, expiresIn = 3600 }: { key: string, responseContentType?: string, expiresIn?: number }) {
    return awsGetSignedUrl(s3, new GetObjectCommand({ Bucket: "email", Key: key, ResponseContentType: responseContentType }), { expiresIn });
}

