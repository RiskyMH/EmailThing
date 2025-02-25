// show git sha and some other important info like bun/node/next version

import { exec as _exec } from 'child_process';

async function exec(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        _exec(command, (error, stdout, stderr) => {
            // if (error) reject(error);
            if (error) resolve(error.message);
            resolve(stdout.trim());
        });
    });
}

export async function GET() {
    const [sha, bunVersion, nodeVersion, nextVersion] = await Promise.all([
        exec('git rev-parse HEAD'),
        exec('bun --version'),
        exec('node --version'),
        exec('bunx next --version'),
    ]);

    const runtime = process.versions.bun ? 'bun' : process.versions.node ? 'node' : 'unknown';
    const buildTime = new Date().toISOString();

    return Response.json({ sha, bunVersion, nodeVersion, nextVersion, runtime, buildTime });
}

