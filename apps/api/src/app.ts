import { randomUUID } from 'node:crypto';
import { API_PREFIX } from '@dlos/shared';
import cors from 'cors';
import express, { type Express } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import type { AppContext } from './core/context';
import { AppError } from './core/errors';
import {
  errorHandler,
  hostGuard,
  jsonBodyGuard,
  noCache,
  notFoundHandler,
  originGuard,
  requestId,
} from './core/http/middleware';
import { basicAuth } from './core/http/auth';
import { buildOpenApiDocument } from './core/http/openapi';
import { webApp } from './core/http/web';
import { APP_VERSION } from './core/version';
import { createApiRouter } from './features/routes';

export function createApp(ctx: AppContext): Express {
  const { config, logger } = ctx;
  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy > 0) app.set('trust proxy', config.trustProxy);

  app.use(requestId());
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => (typeof req.id === 'string' ? req.id : randomUUID()),
      autoLogging: { ignore: (req) => req.url === `${API_PREFIX}/health` },
    }),
  );
  if (config.basicAuth) app.use(basicAuth(config.basicAuth));

  const openApi = buildOpenApiDocument(APP_VERSION);
  app.use(
    '/api/docs',
    hostGuard(config),
    helmet({ contentSecurityPolicy: false }),
    swaggerUi.serve,
    swaggerUi.setup(openApi, {
      customSiteTitle: 'Developer Learning OS API',
    }),
  );

  // YouTube refuses embeds that arrive without a referrer, so keep the origin for cross-origin requests.
  app.use(helmet({ referrerPolicy: { policy: 'strict-origin-when-cross-origin' } }));
  app.use(hostGuard(config));
  app.get('/api/openapi.json', (_req, res) => {
    res.json(openApi);
  });

  app.use(
    cors({
      origin: config.allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      maxAge: 600,
    }),
  );
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: config.rateLimitPerMinute,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      skip: (req) => req.path === `${API_PREFIX}/health`,
      handler: (_req, _res, next) =>
        next(new AppError(429, 'rate_limited', 'Too many requests. Please slow down.')),
    }),
  );
  app.use(originGuard(config));
  app.use(jsonBodyGuard());
  app.use(express.json({ limit: '100kb' }));

  app.use(API_PREFIX, noCache(), createApiRouter(ctx));

  if (config.webDistDir) app.use(webApp(config.webDistDir));

  app.use(notFoundHandler());
  app.use(errorHandler(logger, config.env === 'production'));
  return app;
}
