import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.BACKEND_URL || "http://backend:8000"}/:path*`,
      },
      {
        source: "/games/:path*",
        destination: `${process.env.BACKEND_URL || "http://backend:8000"}/games/:path*`,
      },
      {
        source: "/games",
        destination: `${process.env.BACKEND_URL || "http://backend:8000"}/games`,
      },
    ];
  },
};

export default nextConfig;
