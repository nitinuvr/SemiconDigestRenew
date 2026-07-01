import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Article images come from arbitrary NewsData.io source domains that
    // aren't known ahead of time, so we allow any HTTPS host rather than
    // enumerating them.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
