/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'localhost' },
      { hostname: 'agriconnect.sn' },
    ],
  },
}

module.exports = nextConfig
