/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        // ppr: true,
    },
    async headers() {
        return [
            {
                source: '/mail/:path*',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: `default-src https://riskymh.dev https://emailthing.xyz/ ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'} ${process.env.VERCEL_URL || ''} ${process.env.VERCEL_BRANCH_URL || ''}`,
                    }

                ],
            },
        ];
    },
}

module.exports = nextConfig
