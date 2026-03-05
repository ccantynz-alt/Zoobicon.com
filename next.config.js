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
