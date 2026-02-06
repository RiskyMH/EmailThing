import { S3Client } from "@riskymh/aws/s3";
import { env } from "./env";

// TODO: Bun.s3 instead
const s3 = new S3Client({
    accessKeyId: env.S3_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    // include bucket name in key (i should probably change this to be manually set)
    url: env.S3_URL.includes("email") ? env.S3_URL : env.S3_URL.replace("https://", "https://email."),
});

export function getSignedUrl({
    key,
    responseContentType,
    expiresIn = 3600,
    filename,
}: { key: string; responseContentType?: string; expiresIn?: number; filename?: string }) {
    return s3.presign.GetObject({
        key,
        "X-Amz-Expires": expiresIn,
        "response-content-type": responseContentType,
        ...(filename ? { "response-content-disposition": `attachment; filename="${filename}"` } : {}),
    });
}

export function uploadFile({ key, buffer, contentType }: { key: string; buffer: Buffer | ArrayBuffer; contentType?: string }) {
    return s3.PutObject(
        {
            key,
            "Content-Type": contentType,
            // @ts-expect-error - me being sus with some types
            "Content-Length": buffer.byteLength,
        },
        buffer,
    );
}

export function deleteFile(key: string) {
    return s3.DeleteObject({ key });
}
