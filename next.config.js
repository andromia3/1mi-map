/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['api.mapbox.com'],
  },
}

module.exports = nextConfig
