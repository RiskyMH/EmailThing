// similar to build-info but for runtime info

// dynamic because static would be at build time
export const dynamic = "force-dynamic";

export async function GET() {
    const runtime = process.versions.bun ? 'bun' : process.versions.node ? 'node' : 'unknown';
    return Response.json({
        runtime,
        runtimeVersion: process.versions[runtime],
        date: new Date(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        pid: process.pid,
        version: process.version,
    });
}
