import path from 'node:path';
import { API_PREFIX } from '@dlos/shared';
import express, { type Router } from 'express';

const APP_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  "connect-src 'self'",
  'frame-src https://www.youtube-nocookie.com',
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

// The practice runner executes the learner's own code with new Function inside a Web Worker. Only that script gets 'unsafe-eval'.
const WORKER_POLICY = APP_POLICY.replace("script-src 'self'", "script-src 'self' 'unsafe-eval'");

const isApiPath = (url: string): boolean => url === '/api' || url.startsWith('/api/');

/** Serves the built web app (apps/web/dist) with a single-page-app fallback, so one process can host everything. */
export function webApp(webDistDir: string): Router {
  const router = express.Router();
  const indexFile = path.join(webDistDir, 'index.html');

  router.use((_req, res, next) => {
    res.setHeader('Content-Security-Policy', APP_POLICY);
    res.setHeader('Permissions-Policy', 'camera=(), geolocation=(), microphone=(self)');
    next();
  });

  router.use(
    express.static(webDistDir, {
      index: false,
      setHeaders: (res, file) => {
        const hashed = file.split(path.sep).includes('assets');
        res.setHeader('Cache-Control', hashed ? 'public, max-age=31536000, immutable' : 'no-cache');
        if (hashed && /worker/i.test(path.basename(file))) res.setHeader('Content-Security-Policy', WORKER_POLICY);
      },
    }),
  );

  router.use((req, res, next) => {
    const isPage = (req.method === 'GET' || req.method === 'HEAD') && path.extname(req.path) === '';
    if (!isPage || isApiPath(req.path) || req.path.startsWith(API_PREFIX)) {
      next();
      return;
    }
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(indexFile);
  });

  return router;
}
