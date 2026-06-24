import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://backend:8080/api/:path*",
      },
    ];
  },
};

export default nextConfig;