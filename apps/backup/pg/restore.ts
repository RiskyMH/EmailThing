#!/usr/bin/env bun
import "bun";

// Usage:
// bun run restore.ts [YYYY-MM-DD] [type: daily|weekly|monthly] [db_url]
// Defaults: today, daily, environment DATABASE_URL

const {
    DATABASE_URL,
    S3_URL,
    S3_KEY_ID,
    S3_SECRET_ACCESS_KEY,
} = process.env;

if (!S3_KEY_ID || !S3_SECRET_ACCESS_KEY || !S3_URL) {
    throw new Error("Missing required env vars");
}

const date = process.argv[2] || new Date().toISOString().slice(0, 10);
const type = process.argv[3] || "daily";
const dbUrl = process.argv[4] || DATABASE_URL;
if (!dbUrl) throw new Error("No database URL provided.");


const s3 = new Bun.S3Client({
    endpoint: S3_URL!,
    accessKeyId: S3_KEY_ID!,
    secretAccessKey: S3_SECRET_ACCESS_KEY!,
    bucket: "backups",
});

const remoteKey = `emailthing/${type}/${date}.dump.zst`;
const localZst = Bun.file(`/tmp/emailthing/pgdump-restore-${date}.dump.zst`);
const localDump = Bun.file(`/tmp/emailthing/pgdump-restore-${date}.dump`);

async function main() {
    try {
        console.time("restorepg");
        console.log(`→ Downloading backup: ${remoteKey}`);
        const s3file = s3.file(remoteKey);
        if (!(await s3file.exists())) throw new Error("Backup file not found in S3 (check date/type)");
        await Bun.write(localZst, s3file);

        console.log(`→ Decompressing with zstd...`);
        if (await localDump.exists()) await localDump.delete().catch(() => { });
        const proc1 = await Bun.$`zstd -d -f -T0 --no-progress -o "${localDump.name}" "${localZst.name}"`.nothrow();
        if (proc1.exitCode !== 0) throw new Error("zstd decompress failed");

        console.log(`→ Restoring to database: ${dbUrl!.slice(0, 30)}...`);
        const proc2 = await Bun.$`pg_restore --clean --if-exists --no-owner --no-privileges --verbose -d "${dbUrl}" "${localDump.name}"`.nothrow();
        if (proc2.exitCode !== 0) throw new Error("pg_restore failed");

        console.log("✓ Restore successful! Cleaning up...");
        await localZst.delete().catch(() => { });
        await localDump.delete().catch(() => { });

    } catch (err) {
        console.error("❌ Restore failed:", err);
        console.timeEnd("restorepg");
        process.exit(1);
    }
    console.timeEnd("restorepg");
}

await main();

export { };