import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true, // required — no Image Optimization server on shared hosting
  },
  trailingSlash: true, // matches Apache's folder/index.html structure on static hosting
};

export default nextConfig;