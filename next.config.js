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
    output: process.env.STANDALONE ? "standalone" : undefined,
    transpilePackages: [
        "shiki"
    ],
    logging: {
        fetches: {
            fullUrl: true,
        },
    },
    async headers() {
        const domains = `https://riskymh.dev https://emailthing.xyz https://new.emailthing.xyz ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'} ${process.env.VERCEL_URL || ''} ${process.env.VERCEL_BRANCH_URL || ''}`;
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
            {
                source: '/_next/static/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: `public, max-age=31536000, immutable`,
                    }
                ],
            }
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
                            type: 'header',
                            key: 'Host',
                            value: 'emailthing.me'
                        },
                    ],
                },
                {
                    source: "/\\@:slug",
                    destination: "/emailme/@:slug",
                    has: [
                        {
                            type: 'header',
                            key: 'Host',
                            value: 'emailthing.me'
                        },
                    ],
                },
                {
                    source: "/\^(login|register|mail|pricing|docs|manifest|email):slug*",
                    destination: "/emailme/404?from=:slug*",
                    has: [
                        {
                            type: 'header',
                            key: 'Host',
                            value: 'emailthing.me'
                        },
                    ],
                },
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
                destination: '/docs/api',
                permanent: true,
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
                source: '/(login|register)',
                destination: '/:from?from=',
                permanent: false,
                has: [
                    { type: 'cookie', key: 'token' },
                    { type: 'query', key: 'from' }
                ]
            },
            {
                source: "/emailme",
                destination: "/",
                permanent: true,
                has: [
                    {
                        type: 'header',
                        key: 'Host',
                        value: 'emailthing.me'
                    },
                ],
            },
            {
                source: "/emailme/:path",
                destination: "/:path",
                permanent: true,
                has: [
                    {
                        type: 'header',
                        key: 'Host',
                        value: 'emailthing.me'
                    },
                ],
            },
        ];
    }
};

module.exports = nextConfig;
