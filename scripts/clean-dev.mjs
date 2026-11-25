import fs from 'node:fs';
import path from 'node:path';

const dotNext = path.resolve(process.cwd(), '.next');

if (fs.existsSync(dotNext)) {
  try {
    fs.rmSync(dotNext, { recursive: true, force: true });
  } catch {
    // On Windows, if background processes hold locks, surgically remove conflicting manifests
    try {
      const targets = [
        path.join(dotNext, 'routes-manifest.json'),
        path.join(dotNext, 'server', 'middleware-manifest.json'),
        path.join(dotNext, 'server', 'vendor-chunks'),
        path.join(dotNext, 'server', 'pages'),
      ];
      for (const target of targets) {
        if (fs.existsSync(target)) {
          fs.rmSync(target, { recursive: true, force: true });
        }
      }
    } catch {
      // Fallback
    }
  }
}
