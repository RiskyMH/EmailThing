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
                        value: `img-src https://emailthing.xyz/ ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}`,
                    },

                ],
            },
        ];
    },
}

module.exports = nextConfig
