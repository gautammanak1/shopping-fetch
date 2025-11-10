/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'innovationlab.fetch.ai',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig

