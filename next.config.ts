import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  async redirects() {
    return [
      { source: "/", destination: "/dashboard", permanent: false },
      { source: "/login", destination: "/dashboard", permanent: false },
      { source: "/auth/login", destination: "/dashboard", permanent: false },
    ];
  },
};

export default nextConfig;
