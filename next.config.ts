import type { NextConfig } from "next";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: cloudName
          ? `/${cloudName}/image/upload/**`
          : "/*/image/upload/**",
      },
    ],
  },
};

export default nextConfig;
