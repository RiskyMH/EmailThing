import "server-only"
import { env } from "./env";
import { AwsClient, AwsV4Signer } from 'aws4fetch'

// include bucket name in key (i should probably change this to be manually set)
const s3Url = env.S3_URL.includes("email") ? env.S3_URL : env.S3_URL.replace("https://", "https://email.");

const aws = new AwsClient({ accessKeyId: env.S3_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY })

export async function getSignedUrl({ key, responseContentType, expiresIn = 3600 }: { key: string, responseContentType?: string, expiresIn?: number }) {
    let url = `${s3Url}/${key}?x-id=GetObject&X-Amz-Expires=${expiresIn}`
    if (responseContentType) url += `&response-content-type=${responseContentType}`

    const awsSign = new AwsV4Signer({
        accessKeyId: env.S3_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
        // region: "auto",
        service: "s3",
        url: url.toString(),
        method: "GET",
        signQuery: true,
    })

    const signed = await awsSign.sign()
    return signed.url.toString()
}


export async function uploadFile({ key, buffer, contentType }: { key: string, buffer: Buffer, contentType?: string }) {
    return aws.fetch(`${s3Url}/${key}`, {
        method: 'PUT',
        headers: {
            'Content-Type': contentType || 'application/octet-stream',
            'Content-Length': buffer.length.toString(),
        },
        body: buffer
    })
}

export async function deleteFile(key: string) {
    return aws.fetch(`${s3Url}/${key}`, {
        method: 'DELETE',
    })
}
