/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        // ppr: true,
        useLightningcss: true,
    },
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
                            key: 'token',
                        },
                    ],
                },
                {
                    source: '/(login|register|login\/reset)?',
                    destination: '/mail',
                    has: [
                        {
                            type: 'cookie',
                            key: 'token',
                        },
                    ],
                    missing: [
                        {
                            type: 'cookie',
                            key: 'mailboxId',
                        },
                    ]
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
                source: '/(login|register)?',
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
                destination: '/mail/:mailbox',
                permanent: false,
            },
        ];
    }
};

export default nextConfig;
