/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fail the build on TypeScript errors
  typescript: {
    ignoreBuildErrors: false,
  },
  // Fail the build on ESLint errors
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Compress responses
  compress: true,
  // Optimize images
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
  // Experimental performance features
  experimental: {
    optimizePackageImports: ["framer-motion", "lucide-react"],
  },
  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
