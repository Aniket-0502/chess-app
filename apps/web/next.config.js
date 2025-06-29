import path from "path";
import { fileURLToPath } from "url";

/** @type {import('next').NextConfig} */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {}, // ✅ must be an object
  },
  webpack(config) {
    config.resolve.alias["@"] = path.resolve(__dirname, "app"); // ✅ alias
    return config;
  },
};

export default nextConfig;
