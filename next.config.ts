import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.example.com"],
  serverExternalPackages: ["pg"]
};

export default nextConfig;
