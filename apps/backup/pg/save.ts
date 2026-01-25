#!/usr/bin/env bun
import "bun";

const {
    DATABASE_URL,
    S3_URL,
    S3_KEY_ID,
    S3_SECRET_ACCESS_KEY,
} = process.env;

if (!DATABASE_URL || !S3_KEY_ID || !S3_SECRET_ACCESS_KEY || !S3_URL) {
    throw new Error("Missing required env vars");
}

const s3 = new Bun.S3Client({
    endpoint: S3_URL!,
    accessKeyId: S3_KEY_ID!,
    secretAccessKey: S3_SECRET_ACCESS_KEY!,
    bucket: "backups",
});

function getBackupTypes(now = new Date()) {
    const types: ("daily" | "weekly" | "monthly")[] = ["daily"];
    if (now.getDay() === 0) types.push("weekly");
    if (now.getDate() === 1) types.push("monthly");
    return types;
}

const date = new Date().toISOString().slice(0, 10);
const localPath = `/tmp/emailthing/pgdump-${date}.zst`;

async function runDump(file: Bun.BunFile) {
    console.log(`→ Creating backup dump at ${file.name}...`);
    await file.delete().catch(() => { });

    const proc = await Bun.$`pg_dump --format=custom --compress=0 ${DATABASE_URL} | zstd -9 -T0 --long -o ${file.name}`
        .env({ DATABASE_URL, PATH: process.env.PATH })
        .nothrow();
    if (proc.exitCode !== 0) throw new Error(`Backup failed (exit ${proc.exitCode})`);

    const { size } = await file.stat();
    console.log(`  Dump size: ${(size / 1024 / 1024).toFixed(2)} MB`);
}

async function uploadBackup(key: string, file: Bun.BunFile) {
    console.log(`→ Uploading to R2 as ${key}...`);
    await s3.file(key).write(file, { type: "application/zstd" });
    console.log(`  Upload complete.`);
}

async function main() {
    try {
        console.time("savepg");
        const localFile = Bun.file(localPath);
        await runDump(localFile);

        const types = getBackupTypes();
        for (const type of types) {
            const key = `emailthing/${type}/${date}.dump.zst`;
            await uploadBackup(key, localFile);
        }

        console.log("→ Deleting local dump...");
        await localFile.delete();

        console.log("✓ Backup completed successfully!");
        console.timeEnd("savepg");
    } catch (err) {
        console.error("❌ Backup failed:", err);
        console.timeEnd("savepg");
        process.exit(1);
    }
}

await main();

export { };