import { createHash, timingSafeEqual } from 'node:crypto';
import { API_PREFIX } from '@dlos/shared';
import type { RequestHandler } from 'express';
import { AppError } from '../errors';

const MAX_FAILURES = 20;
const WINDOW_MS = 15 * 60_000;
const MAX_TRACKED_CLIENTS = 1_000;

const digest = (value: string): Buffer => createHash('sha256').update(value).digest();

/**
 * HTTP Basic auth for a deployment that is reachable from the internet. Everything except the health check
 * (which hosting platforms poll) needs the credentials. Repeated failures from one address are blocked for a while.
 */
export function basicAuth(credentials: { user: string; password: string }, now: () => number = Date.now): RequestHandler {
  const expectedUser = digest(credentials.user);
  const expectedPassword = digest(credentials.password);
  const failures = new Map<string, { count: number; resetAt: number }>();

  return (req, res, next) => {
    if (req.path === `${API_PREFIX}/health`) {
      next();
      return;
    }

    const client = req.ip ?? 'unknown';
    const time = now();
    const recent = failures.get(client);
    if (recent && recent.resetAt <= time) failures.delete(client);
    const current = failures.get(client);
    if (current && current.count >= MAX_FAILURES) {
      next(new AppError(429, 'rate_limited', 'Too many failed sign-in attempts. Try again in a few minutes.'));
      return;
    }

    const [scheme, encoded] = (req.headers.authorization ?? '').split(' ');
    if (scheme?.toLowerCase() === 'basic' && encoded) {
      const decoded = Buffer.from(encoded, 'base64').toString('utf8');
      const separator = decoded.indexOf(':');
      if (separator >= 0) {
        // Both comparisons always run, so timing does not reveal which part was wrong.
        const userMatches = timingSafeEqual(digest(decoded.slice(0, separator)), expectedUser);
        const passwordMatches = timingSafeEqual(digest(decoded.slice(separator + 1)), expectedPassword);
        if (userMatches && passwordMatches) {
          next();
          return;
        }
      }
    }

    if (failures.size >= MAX_TRACKED_CLIENTS) {
      for (const [key, entry] of failures) if (entry.resetAt <= time) failures.delete(key);
    }
    if (failures.size < MAX_TRACKED_CLIENTS) {
      failures.set(client, { count: (current?.count ?? 0) + 1, resetAt: current?.resetAt ?? time + WINDOW_MS });
    }
    res.setHeader('WWW-Authenticate', 'Basic realm="Developer Learning OS", charset="UTF-8"');
    next(new AppError(401, 'unauthorized', 'Sign in to continue.'));
  };
}
