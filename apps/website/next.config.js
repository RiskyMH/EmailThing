/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        // ppr: true,
        useLightningcss: true,
    },
    async headers() {
        const domains = `https://riskymh.dev https://emailthing.xyz/ ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'} ${process.env.VERCEL_URL || ''} ${process.env.VERCEL_BRANCH_URL || ''}`;
        return [
            {
                source: '/mail/:path*',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: `img-src ${domains}; font-src ${domains} ${process.env.NODE_ENV === 'development' ? 'https://fonts.gstatic.com' : ''};`,
                    }

                ],
            },
        ];
    },
};

module.exports = nextConfig;
