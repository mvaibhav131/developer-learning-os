import type { Router } from 'express';
import type { z } from 'zod';
import type { EndpointSpec, HandlerInput, HandlerResult } from '@dlos/shared';
import { AppError } from '../errors';

function parseInput(schema: z.ZodType, value: unknown, what: string): unknown {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  throw new AppError(400, 'validation_error', `Invalid ${what}`, {
    issues: result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  });
}

/**
 * Registers an endpoint from the shared contract. Inputs are validated before the handler runs and
 * the result is parsed through the response schema, which strips fields that are not in the contract.
 */
export function registerRoute<E extends EndpointSpec>(
  router: Router,
  endpoint: E,
  handler: (input: HandlerInput<E>) => HandlerResult<E> | Promise<HandlerResult<E>>,
): void {
  router[endpoint.method](endpoint.path, async (req, res) => {
    const input: Record<string, unknown> = {};
    if (endpoint.params) input.params = parseInput(endpoint.params, req.params, 'path parameters');
    if (endpoint.query) input.query = parseInput(endpoint.query, req.query, 'query string');
    if (endpoint.body) input.body = parseInput(endpoint.body, req.body ?? {}, 'request body');

    const result = await handler(input as HandlerInput<E>);

    const status = endpoint.status ?? 200;
    if (!endpoint.response) {
      res.status(status).end();
      return;
    }
    res.status(status).json(endpoint.response.parse(result));
  });
}
