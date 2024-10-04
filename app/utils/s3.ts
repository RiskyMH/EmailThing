import "server-only"
import { env } from "./env";
import { S3Client } from '@riskymh/aws/s3'


const s3 = new S3Client({
    accessKeyId: env.S3_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    // include bucket name in key (i should probably change this to be manually set)
    url: env.S3_URL.includes("email") ? env.S3_URL : env.S3_URL.replace("https://", "https://email.")
})


export function getSignedUrl({ key, responseContentType, expiresIn = 3600 }: { key: string, responseContentType?: string, expiresIn?: number }) {
    return s3.presign.GetObject({
        key,
        "X-Amz-Expires": expiresIn,
        "response-content-type": responseContentType
    })
}

export function uploadFile({ key, buffer, contentType }: { key: string, buffer: Buffer, contentType?: string }) {
    return s3.PutObject({
        key,
        'Content-Type': contentType,
        // @ts-expect-error - me being sus with some types
        "Content-Length": buffer.byteLength
    }, buffer)
}

export function deleteFile(key: string) {
    return s3.DeleteObject({ key })
}
