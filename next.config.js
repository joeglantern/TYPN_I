/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hbprwrzwhrkxvldwinti.supabase.co',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    unoptimized: false,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    optimizePackageImports: ['lucide-react'],
    webpackBuildWorker: true,
  },
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png)',
        locale: false,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig 