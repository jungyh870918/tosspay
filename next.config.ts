import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    config.externals = config.externals || [];
    config.externals.push("bufferutil", "utf-8-validate");

    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        bufferutil: false,
        "utf-8-validate": false,
      };
    }
    return config;
  },
};

export default nextConfig;
