import type { NextConfig } from "next";
import path from "node:path";

const apiOrigin = process.env.API_INTERNAL_URL || "http://localhost:5000";

const nextConfig: NextConfig = {
  // Docker/self-host needs standalone. Vercel sets VERCEL=1 and uses its own
  // output tracing; standalone there can stall or OOM during "Collecting build traces".
  ...(!process.env.VERCEL ? { output: "standalone" as const } : {}),
  outputFileTracingRoot: path.join(__dirname),
  serverExternalPackages: ["handlebars"],
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
};

export default nextConfig;
