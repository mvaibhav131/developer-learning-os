import { randomUUID } from 'node:crypto';
import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError } from 'zod';
import type { ApiErrorBody } from '@dlos/shared';
import type { AppConfig } from '../../config/env';
import { AppError, forbidden } from '../errors';
import type { Logger } from '../logger';

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function hostname(hostHeader: string): string {
  if (hostHeader.startsWith('[')) return hostHeader.slice(0, hostHeader.indexOf(']') + 1);
  return hostHeader.split(':')[0] ?? hostHeader;
}

export function requestId(): RequestHandler {
  return (req, res, next) => {
    const id = randomUUID();
    req.id = id;
    res.setHeader('X-Request-Id', id);
    next();
  };
}

/** Rejects unexpected Host headers so a rebinding attack cannot reach the local API. */
export function hostGuard(config: Pick<AppConfig, 'allowedHosts'>): RequestHandler {
  const allowed = new Set(config.allowedHosts.map((host) => host.toLowerCase()));
  return (req, _res, next) => {
    const host = req.headers.host;
    if (host && allowed.has(hostname(host).toLowerCase())) {
      next();
      return;
    }
    next(forbidden('invalid_host', 'This host name is not allowed to call the API.'));
  };
}

/** State-changing browser requests must come from an allowed origin. Non-browser clients send no Origin. */
export function originGuard(config: Pick<AppConfig, 'allowedOrigins'>): RequestHandler {
  const allowed = new Set(config.allowedOrigins);
  return (req, _res, next) => {
    const origin = req.headers.origin;
    if (UNSAFE_METHODS.has(req.method) && origin && !allowed.has(origin)) {
      next(forbidden('forbidden_origin', 'This origin is not allowed to modify data.'));
      return;
    }
    next();
  };
}

/** Bodies must be JSON. Anything else is rejected instead of silently ignored. */
export function jsonBodyGuard(): RequestHandler {
  return (req, _res, next) => {
    const length = Number(req.headers['content-length'] ?? 0);
    const hasBody = length > 0 || req.headers['transfer-encoding'] !== undefined;
    if (UNSAFE_METHODS.has(req.method) && hasBody && !req.is('application/json')) {
      next(new AppError(415, 'unsupported_media_type', 'Send request bodies as application/json.'));
      return;
    }
    next();
  };
}

export function noCache(): RequestHandler {
  return (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache');
    next();
  };
}

export function notFoundHandler(): RequestHandler {
  return (req, _res, next) => {
    next(new AppError(404, 'not_found', `No route for ${req.method} ${req.path}`));
  };
}

interface HttpLikeError {
  status?: number;
  statusCode?: number;
  type?: string;
  message?: string;
}

export function errorHandler(logger: Logger, isProduction: boolean): ErrorRequestHandler {
  return (error: unknown, req: Request, res: Response, _next: NextFunction) => {
    const id = typeof req.id === 'string' ? req.id : undefined;
    let status = 500;
    let body: ApiErrorBody['error'] = {
      code: 'internal_error',
      message: 'Something went wrong on the server.',
      requestId: id,
    };

    if (error instanceof AppError) {
      status = error.status;
      body = { code: error.code, message: error.message, details: error.details, requestId: id };
    } else if (error instanceof ZodError) {
      logger.error({ err: error, requestId: id }, 'Response did not match the API contract');
    } else {
      const http = error as HttpLikeError;
      const httpStatus = http.status ?? http.statusCode;
      if (http.type === 'entity.parse.failed') {
        status = 400;
        body = { code: 'invalid_json', message: 'The request body is not valid JSON.', requestId: id };
      } else if (http.type === 'entity.too.large') {
        status = 413;
        body = { code: 'payload_too_large', message: 'The request body is too large.', requestId: id };
      } else if (typeof httpStatus === 'number' && httpStatus >= 400 && httpStatus < 500) {
        status = httpStatus;
        body = { code: 'bad_request', message: http.message ?? 'Bad request', requestId: id };
      } else {
        logger.error({ err: error, requestId: id }, 'Unhandled error');
        if (!isProduction && error instanceof Error) body.details = { cause: error.message };
      }
    }

    res.status(status).json({ error: body });
  };
}
