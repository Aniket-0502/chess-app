import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {},
  },
  webpack(config) {
    config.resolve.alias["@"] = path.resolve(__dirname); // ← alias to root of /apps/web
    return config;
  },
};

export default nextConfig;
