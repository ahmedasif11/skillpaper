import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
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
