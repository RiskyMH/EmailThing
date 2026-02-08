import { env } from "./env";

const s3 = new Bun.S3Client({
    accessKeyId: env.S3_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    endpoint: env.S3_URL,
    bucket: env.S3_BUCKET,
})

export function getSignedUrl({
    key,
    responseContentType,
    expiresIn = 3600,
    filename,
}: { key: string; responseContentType?: string; expiresIn?: number; filename?: string }) {
    return s3.presign(key,
        {
            expiresIn,
            contentDisposition: filename ? `attachment; filename="${filename}"` : undefined,
            type: responseContentType,
            acl: "authenticated-read",
            method: "GET",
        }
    );
}

export function uploadFile({ key, buffer, contentType }: { key: string; buffer: Buffer | ArrayBuffer; contentType?: string }) {
    return s3.write(key, buffer, { type: contentType });
}

export function deleteFile(key: string) {
    return s3.delete(key);
}
