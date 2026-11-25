/** @type {import('next').NextConfig} */

// Mount path configured in the Webflow Cloud dashboard.
// Override with NEXT_PUBLIC_BASE_PATH (set it to "" to serve from the root locally).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '/products/harness-ai/prompt-library'

const nextConfig = {
  basePath,
  assetPrefix: basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
