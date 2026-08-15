import type { NextConfig } from "next";

const apiOrigin = process.env.API_INTERNAL_URL || "http://localhost:5000";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    // Handlebars package root uses require.extensions; point at the CJS build for the browser.
    config.resolve.alias = {
      ...config.resolve.alias,
      handlebars: "handlebars/dist/cjs/handlebars.js",
    };
    return config;
  },
};

export default nextConfig;
