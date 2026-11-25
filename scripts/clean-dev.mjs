import fs from 'node:fs';
import path from 'node:path';

const dotNext = path.resolve(process.cwd(), '.next');
const serverDir = path.join(dotNext, 'server');

// 1. Clean stale build caches
try {
  if (fs.existsSync(dotNext)) {
    fs.rmSync(dotNext, { recursive: true, force: true });
  }
} catch {
  try {
    const targets = [
      path.join(dotNext, 'cache'),
      path.join(serverDir, 'vendor-chunks'),
      path.join(serverDir, 'pages'),
    ];
    for (const t of targets) {
      if (fs.existsSync(t)) fs.rmSync(t, { recursive: true, force: true });
    }
  } catch {}
}

// 2. Immediately seed required manifest structures so cold dev requests never throw ENOENT
try {
  fs.mkdirSync(serverDir, { recursive: true });

  const routesManifestPath = path.join(dotNext, 'routes-manifest.json');
  if (!fs.existsSync(routesManifestPath)) {
    const defaultRoutesManifest = {
      version: 3,
      pages404: true,
      caseSensitive: false,
      basePath: '',
      redirects: [],
      headers: [],
      dynamicRoutes: [],
      staticRoutes: [],
      dataRoutes: [],
      rsc: {
        header: 'rsc',
        varyHeader: 'rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch',
        prefetchHeader: 'next-router-prefetch',
        didPostponeHeader: 'x-nextjs-postponed',
        contentTypeHeader: 'text/x-component',
        suffix: '.rsc',
        prefetchSuffix: '.prefetch.rsc',
      },
      rewrites: {
        beforeFiles: [],
        afterFiles: [],
        fallback: [],
      },
    };
    fs.writeFileSync(routesManifestPath, JSON.stringify(defaultRoutesManifest, null, 2), 'utf8');
  }

  const middlewareManifestPath = path.join(serverDir, 'middleware-manifest.json');
  if (!fs.existsSync(middlewareManifestPath)) {
    const defaultMiddlewareManifest = {
      version: 3,
      middleware: {},
      sortedMiddleware: [],
      functions: {},
    };
    fs.writeFileSync(middlewareManifestPath, JSON.stringify(defaultMiddlewareManifest, null, 2), 'utf8');
  }

  const pagesManifestPath = path.join(serverDir, 'pages-manifest.json');
  if (!fs.existsSync(pagesManifestPath)) {
    fs.writeFileSync(pagesManifestPath, '{}', 'utf8');
  }

  const appPathsManifestPath = path.join(serverDir, 'app-paths-manifest.json');
  if (!fs.existsSync(appPathsManifestPath)) {
    fs.writeFileSync(appPathsManifestPath, '{}', 'utf8');
  }
} catch {
  // Non-blocking
}
