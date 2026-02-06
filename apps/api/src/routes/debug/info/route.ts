
export async function GET() {
    const [sha, bunVersion, gitCommit] = await Promise.all([
        Bun.$`git rev-parse HEAD`.text().then(text => text.trim()).catch(() => "unknown"),
        Bun.$`bun --version`.text().then(text => text.trim()).catch(() => Bun.version),
        Bun.$`git show -s --format="%s [%ci]" HEAD`.text().then(text => text.trim()).catch(() => "unknown"),
    ]);

    // if (bunVersion !== Bun.version) {
    //     throw new Error(`Bun version mismatch: ${bunVersion} !== ${Bun.version}`);
    // }

    return Response.json({
        sha,
        bunVersion: Bun.version,
        gitCommit,
        runtime: {
            runtimeVersion: process.versions.bun,
            date: new Date(),
            uptime: process.uptime(),
            uptimeFormatted: formatDuration(process.uptime()),
            memoryUsage: process.memoryUsage(),
            memoryUsageFormatted: formatObjectOfBytes(process.memoryUsage()),
            cpuUsage: process.cpuUsage(),
            pid: process.pid,
        }
    });
}

function formatDuration(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
}

function formatObjectOfBytes(objj: NodeJS.MemoryUsage) {
    const obj: Record<string, string> = {}

    for (const [key, value] of Object.entries(objj)) {
        obj[key] = `${(value / 1024 / 1024).toFixed(2)} MB`;
    }

    return obj;
}