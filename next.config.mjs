import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: rootDir,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/building/:slug',
        destination: '/:slug',
        permanent: true,
      },
      {
        source: '/building/:slug/search',
        destination: '/:slug/search',
        permanent: true,
      },
      {
        source: '/building/:slug/category/:categorySlug',
        destination: '/:slug/category/:categorySlug',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
