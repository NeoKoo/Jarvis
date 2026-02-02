const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for production
  compress: true,

  // Strict mode for better error detection
  reactStrictMode: true,

  // Output mode for Docker deployment
  output: 'standalone',

  // Image optimization (works with Next.js 15)
  images: {
    formats: ['image/avif', 'image/webp'],
  },
}

module.exports = withPWA(nextConfig)
