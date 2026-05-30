import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "trashapi.tierkun.my.id",
      },
      {
        protocol: "https",
        hostname: "exp.tierkun.my.id",
      },
    ],
  },
};

export default nextConfig;

