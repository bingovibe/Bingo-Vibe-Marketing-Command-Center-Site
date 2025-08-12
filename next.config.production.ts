
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production configuration - enable strict checks
  typescript: {
    // Enable TypeScript checks in production
    ignoreBuildErrors: false,
  },
  eslint: {
    // Enable ESLint checks in production  
    ignoreDuringBuilds: false,
  },
  // Optimize for production
  swcMinify: true,
  compress: true,
  // API routes configuration for Vercel
  serverRuntimeConfig: {},
  publicRuntimeConfig: {},
};

export default nextConfig;
