/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'agriconnect.sn'],
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
