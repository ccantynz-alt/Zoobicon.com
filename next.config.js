/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tree-shake lucide-react so only used icons are bundled (major size win)
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },

  // Disable source maps in production for smaller/faster builds
  productionBrowserSourceMaps: false,

  // Skip ESLint during builds (run it separately in CI if needed)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Skip type checking during builds (run tsc separately in CI if needed)
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
