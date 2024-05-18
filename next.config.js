/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        // ppr: true,
        useLightningcss: process.env.TURBOPACK === "1",
        outputFileTracingIncludes: {
            '/mail/[mailbox]/config': ['./public/cloudflare-worker.js'],
        },
        // optimizePackageImports: [
        //     'shiki',
        // ],
        // reactCompiler: !process.env.TURBOPACK
    },
    transpilePackages: [
        "shiki"
    ],
    logging: {
        fetches: {
            fullUrl: true,
        },
    },
    async headers() {
        const domains = `https://riskymh.dev https://emailthing.xyz ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'} ${process.env.VERCEL_URL || ''} ${process.env.VERCEL_BRANCH_URL || ''}`;
        return [
            {
                source: '/mail/:path*',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: `img-src ${domains} https://www.gravatar.com; font-src ${domains} ${process.env.NODE_ENV === 'development' ? 'https://fonts.gstatic.com' : ''};`,
                    }

                ],
            },
        ];
    },
    async rewrites() {
        return {
            beforeFiles: [
                {
                    source: "/",
                    destination: "/home",
                    missing: [
                        {
                            type: 'cookie',
                            key: 'mailboxId',
                        },
                    ],
                },
            ],
            afterFiles: [],
            fallback: [],
        };
    },
    async redirects() {
        return [
            {
                source: '/mail/:mailbox/:email/raw',
                destination: '/mail/:mailbox/:email/email.eml',
                permanent: true,
            },
            {
                source: '/api/recieve-email',
                destination: '/api/v0/receive-email',
                permanent: true,
            },
            {
                source: '/api-docs',
                destination: 'https://github.com/RiskyMH/EmailThing/tree/main/app/api/v0#readme',
                permanent: false,
            },
            {
                source: "/mail/:path*",
                destination: "/login?from=/mail/:path*",
                missing: [
                    {
                        type: 'cookie',
                        key: 'token',
                    },
                ],
                permanent: false,
            },
            {
                source: "/",
                destination: "/login",
                has: [
                    { type: 'cookie', key: 'mailboxId' },
                ],
                missing: [
                    { type: 'cookie', key: 'token' },
                ],
                permanent: false,
            },
            {
                source: '/(login|register|login\/reset)?',
                has: [
                    {
                        type: 'cookie',
                        key: 'token',
                    },
                    {
                        type: 'cookie',
                        key: 'mailboxId',
                        value: '(?<mailbox>.*)'
                    },
                ],
                missing: [
                    { type: 'query', key: 'from' }
                ],
                destination: '/mail/:mailbox',
                permanent: false,
            },
            {
                source: '/login',
                destination: '/:from?from=',
                permanent: false,
                has: [
                    { type: 'cookie', key: 'token' },
                    { type: 'query', key: 'from' }
                ]
            },
        ];
    }
};

module.exports = nextConfig;
