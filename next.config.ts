import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/1inch/:path*',
        destination: 'https://api.1inch.dev/:path*',
      },
    ];
  },
};

export default nextConfig;
