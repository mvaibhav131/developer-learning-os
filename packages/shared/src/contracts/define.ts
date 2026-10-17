import type { z } from 'zod';

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export interface EndpointSpec {
  readonly id: string;
  readonly method: HttpMethod;
  /** Path relative to the API prefix, using `:param` placeholders. */
  readonly path: string;
  readonly summary: string;
  readonly description?: string;
  readonly tags: readonly string[];
  readonly params?: z.ZodType;
  readonly query?: z.ZodType;
  readonly body?: z.ZodType;
  /** Omit for endpoints that answer 204 No Content. */
  readonly response?: z.ZodType;
  readonly status?: number;
}

export function defineEndpoint<const E extends EndpointSpec>(spec: E): E {
  return spec;
}

type Schema<E, K extends string> = E extends Record<K, infer S extends z.ZodType> ? S : never;

/** What a caller (the web client) must provide. */
export type RequestInput<E extends EndpointSpec> = ([Schema<E, 'params'>] extends [never]
  ? unknown
  : { params: z.input<Schema<E, 'params'>> }) &
  ([Schema<E, 'query'>] extends [never] ? unknown : { query?: z.input<Schema<E, 'query'>> }) &
  ([Schema<E, 'body'>] extends [never] ? unknown : { body: z.input<Schema<E, 'body'>> });

/** What a server handler receives after validation. */
export type HandlerInput<E extends EndpointSpec> = ([Schema<E, 'params'>] extends [never]
  ? unknown
  : { params: z.output<Schema<E, 'params'>> }) &
  ([Schema<E, 'query'>] extends [never] ? unknown : { query: z.output<Schema<E, 'query'>> }) &
  ([Schema<E, 'body'>] extends [never] ? unknown : { body: z.output<Schema<E, 'body'>> });

export type ResponseOf<E extends EndpointSpec> = [Schema<E, 'response'>] extends [never]
  ? undefined
  : z.output<Schema<E, 'response'>>;

export type HandlerResult<E extends EndpointSpec> = [Schema<E, 'response'>] extends [never]
  ? undefined
  : z.input<Schema<E, 'response'>>;

export type CallArgs<E extends EndpointSpec> = object extends RequestInput<E>
  ? [input?: RequestInput<E>]
  : [input: RequestInput<E>];
