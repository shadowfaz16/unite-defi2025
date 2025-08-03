import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/1inch/:path*',
        destination: 'https://1inch-vercel-proxy-lyart.vercel.app/:path*',
      },
    ];
  },
};

export default nextConfig;
