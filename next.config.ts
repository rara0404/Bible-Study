import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    return config;
  },
  reactStrictMode: true,
};

export default nextConfig;
