import pino, { type Logger } from 'pino';
import type { AppConfig } from '../config/env';

export type { Logger };

export function createLogger(config: Pick<AppConfig, 'env' | 'logLevel'>): Logger {
  const pretty = config.env === 'development' && config.logLevel !== 'silent';
  return pino({
    level: config.logLevel,
    redact: ['req.headers.authorization', 'req.headers.cookie'],
    ...(pretty
      ? {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
          },
        }
      : {}),
  });
}
