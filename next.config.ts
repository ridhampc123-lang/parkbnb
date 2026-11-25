import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";

// Permanent root-cause safeguard:
// Guarantee all required Next.js manifests exist on cold start so that
// base-server and next-server never throw ENOENT or MODULE_NOT_FOUND during on-demand compilation.
try {
  const dotNext = path.resolve(process.cwd(), ".next");
  const serverDir = path.join(dotNext, "server");
  if (!fs.existsSync(serverDir)) {
    fs.mkdirSync(serverDir, { recursive: true });
  }

  const routesManifestPath = path.join(dotNext, "routes-manifest.json");
  if (!fs.existsSync(routesManifestPath)) {
    const defaultRoutesManifest = {
      version: 3,
      pages404: true,
      caseSensitive: false,
      basePath: "",
      redirects: [],
      headers: [],
      dynamicRoutes: [],
      staticRoutes: [],
      dataRoutes: [],
      rsc: {
        header: "rsc",
        varyHeader: "rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch",
        prefetchHeader: "next-router-prefetch",
        didPostponeHeader: "x-nextjs-postponed",
        contentTypeHeader: "text/x-component",
        suffix: ".rsc",
        prefetchSuffix: ".prefetch.rsc",
      },
      rewrites: {
        beforeFiles: [],
        afterFiles: [],
        fallback: [],
      },
    };
    fs.writeFileSync(routesManifestPath, JSON.stringify(defaultRoutesManifest, null, 2), "utf8");
  }

  const middlewareManifestPath = path.join(serverDir, "middleware-manifest.json");
  if (!fs.existsSync(middlewareManifestPath)) {
    const defaultMiddlewareManifest = {
      version: 3,
      middleware: {},
      sortedMiddleware: [],
      functions: {},
    };
    fs.writeFileSync(middlewareManifestPath, JSON.stringify(defaultMiddlewareManifest, null, 2), "utf8");
  }

  const pagesManifestPath = path.join(serverDir, "pages-manifest.json");
  if (!fs.existsSync(pagesManifestPath)) {
    fs.writeFileSync(pagesManifestPath, "{}", "utf8");
  }

  const appPathsManifestPath = path.join(serverDir, "app-paths-manifest.json");
  if (!fs.existsSync(appPathsManifestPath)) {
    fs.writeFileSync(appPathsManifestPath, "{}", "utf8");
  }
} catch {
  // Non-blocking fallback
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
