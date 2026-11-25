import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";

// Permanent root-cause safeguard:
// Prevent stale production build manifests from colliding with Next.js development server
if (process.env.NODE_ENV !== "production") {
  try {
    const dotNext = path.resolve(process.cwd(), ".next");
    const staleRoutesManifest = path.join(dotNext, "routes-manifest.json");
    if (fs.existsSync(staleRoutesManifest)) {
      fs.rmSync(staleRoutesManifest, { force: true });
      const staleMiddleware = path.join(dotNext, "server", "middleware-manifest.json");
      if (fs.existsSync(staleMiddleware)) {
        fs.rmSync(staleMiddleware, { force: true });
      }
      const staleVendorChunks = path.join(dotNext, "server", "vendor-chunks");
      if (fs.existsSync(staleVendorChunks)) {
        fs.rmSync(staleVendorChunks, { recursive: true, force: true });
      }
      const stalePages = path.join(dotNext, "server", "pages");
      if (fs.existsSync(stalePages)) {
        fs.rmSync(stalePages, { recursive: true, force: true });
      }
    }
  } catch {
    // Fallback gracefully
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Treat all backend Supabase libraries as external server packages.
  // Instructs Next.js webpack to resolve them natively from node_modules,
  // preventing synthetic ./vendor-chunks/@supabase.js generation errors.
  serverExternalPackages: [
    "@supabase/server",
    "@supabase/ssr",
    "@supabase/supabase-js",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
