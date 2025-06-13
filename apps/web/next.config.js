const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://www.gravatar.com https://avatars.githubusercontent.com;
    font-src 'self' ${process.env.NODE_ENV === "development" ? "https://fonts.gstatic.com" : ""};
    object-src 'self';
    base-uri 'self';
    form-action 'self';
    frame-src 'self' https://challenges.cloudflare.com;
    frame-ancestors 'none';
    connect-src 'self' https://cloudflare-dns.com;
    upgrade-insecure-requests;
`;

/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        // ppr: true,
        useLightningcss: process.env.TURBOPACK === "1",
        // optimizePackageImports: [
        //     'shiki',
        // ],
        // reactCompiler: !process.env.TURBOPACK
        staleTimes: {
            dynamic: 30,
            static: 180,
        },
    },
    output: process.env.STANDALONE ? "standalone" : undefined,
    outputFileTracingIncludes: {
        "/mail/[mailbox]/config": ["./public/cloudflare-worker.js"],
    },
    // transpilePackages: ["shiki"],
    transpilePackages: ["@emailthing/db", "@emailthing/const"],
    eslint: {
        ignoreDuringBuilds: true,
    },
    logging: {
        fetches: {
            fullUrl: true,
        },
    },
    images: {
        unoptimized: true,
    },
    compress: !process.env.STANDALONE,
    productionBrowserSourceMaps: process.env.GITHUB_ACTIONS === "true",
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "X-Frame-Options",
                        value: "DENY",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    {
                        key: "Content-Security-Policy",
                        value: cspHeader.replace(/\n/g, ""),
                    },
                ],
            },
            {
                source: "/service.js",
                headers: [
                    {
                        key: "Content-Type",
                        value: "application/javascript; charset=utf-8",
                    },
                    {
                        key: "Cache-Control",
                        value: "no-cache, no-store, must-revalidate",
                    },
                    {
                        key: "Content-Security-Policy",
                        value: "default-src 'self'; script-src 'self'",
                    },
                ],
            },
            {
                source: "/_next/static/:path*",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, max-age=31536000, immutable",
                    },
                ],
            },
            // {
            //     source: "/api/internal/:path*",
            //     headers: [
            //         {
            //             key: "Access-Control-Allow-Origin",
            //             value: "*",
            //         },
            //         {
            //             key: "Access-Control-Allow-Credentials",
            //             value: "true",
            //         },
            //         {
            //             key: "Access-Control-Allow-Headers",
            //             value: "authorization",
            //         },
            //     ],
            // }
        ];
    },
    async rewrites() {
        return {
            beforeFiles: [
                {
                    source: "/",
                    destination: "/emailme",
                    has: [
                        {
                            type: "host",
                            value: "emailthing.me",
                        },
                    ],
                },
                {
                    source: "/",
                    destination: "/home",
                    missing: [
                        {
                            type: "cookie",
                            key: "mailboxId",
                        },
                    ],
                },
                {
                    source: "/(login|register|mail|pricing|docs|manifest|email)",
                    destination: "/emailme/404",
                    has: [
                        {
                            type: "host",
                            value: "emailthing.me",
                        },
                    ],
                },
            ],
            afterFiles: [
                {
                    source: "/:path*",
                    destination: "/emailme/:path*",
                    has: [
                        {
                            type: "host",
                            value: "emailthing.me",
                        },
                    ],
                },
            ],
            fallback: [],
        };
    },
    async redirects() {
        return [
            {
                source: "/mail/:mailbox/:email/raw",
                destination: "/mail/:mailbox/:email/email.eml",
                permanent: true,
            },
            {
                source: "/api/recieve-email",
                destination: "/api/v0/receive-email",
                permanent: true,
            },
            {
                source: "/api-docs",
                destination: "/docs/api",
                permanent: true,
            },
            {
                source: "/mail/:path*",
                destination: "/login?from=/mail/:path*",
                missing: [
                    {
                        type: "cookie",
                        key: "token",
                    },
                ],
                permanent: false,
            },
            {
                source: "/",
                destination: "/login",
                has: [{ type: "cookie", key: "mailboxId" }],
                missing: [{ type: "cookie", key: "token" }],
                permanent: false,
            },
            {
                source: "/(login|register|login/reset)?",
                has: [
                    {
                        type: "cookie",
                        key: "token",
                    },
                    {
                        type: "cookie",
                        key: "mailboxId",
                        value: "(?<mailbox>.*)",
                    },
                ],
                missing: [{ type: "query", key: "from" }],
                destination: "/mail/:mailbox",
                permanent: false,
            },
            {
                source: "/mail/~/:path",
                has: [
                    {
                        type: "cookie",
                        key: "token",
                    },
                    {
                        type: "cookie",
                        key: "mailboxId",
                        value: "(?<mailbox>.*)",
                    },
                ],
                destination: "/mail/:mailbox/:path",
                permanent: false,
            },
            {
                source: "/mail/:mailbox/inbox",
                destination: "/mail/:mailbox",
                permanent: false,
            },
            {
                source: "/(login|register)",
                destination: "/:from?from=",
                permanent: false,
                has: [
                    { type: "cookie", key: "token" },
                    { type: "query", key: "from" },
                ],
            },
            {
                source: "/emailme",
                destination: "/",
                permanent: true,
                has: [
                    {
                        type: "header",
                        key: "Host",
                        value: "emailthing.me",
                    },
                ],
            },
            {
                source: "/emailme/:path",
                destination: "https://emailthing.me/:path",
                permanent: false,
                has: [
                    {
                        type: "host",
                        value: "emailthing.app",
                    },
                ],
            },
            {
                source: "/emailme",
                destination: "https://emailthing.me",
                permanent: false,
                has: [
                    {
                        type: "host",
                        value: "emailthing.app",
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
