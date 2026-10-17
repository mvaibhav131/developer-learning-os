import {
  API_PREFIX,
  apiErrorSchema,
  type EndpointSpec,
  type RequestInput,
  type ResponseOf,
} from '@dlos/shared';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface CallOptions {
  signal?: AbortSignal;
  /** Lets the request finish while the page is being closed. */
  keepalive?: boolean;
}

type CallArgs<E extends EndpointSpec> = object extends RequestInput<E>
  ? [input?: RequestInput<E>, options?: CallOptions]
  : [input: RequestInput<E>, options?: CallOptions];

type Loose = { params?: Record<string, unknown>; query?: Record<string, unknown>; body?: unknown };

function toText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  return JSON.stringify(value);
}

function buildPath(path: string, params: Record<string, unknown> | undefined): string {
  return path.replace(/:([A-Za-z0-9_]+)/g, (_match, name: string) => {
    const value = params?.[name];
    if (value === undefined || value === null) throw new Error(`Missing path parameter "${name}"`);
    return encodeURIComponent(toText(value));
  });
}

function buildQuery(query: Record<string, unknown> | undefined): string {
  if (!query) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, toText(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const parsed = apiErrorSchema.safeParse(await response.json());
    if (parsed.success) {
      const { code, message, details } = parsed.data.error;
      return new ApiError(response.status, code, message, details);
    }
  } catch {
    /* fall through to the generic error */
  }
  return new ApiError(response.status, 'http_error', `Request failed with status ${response.status}`);
}

/** Calls an endpoint from the shared contract and validates the response against it. */
export async function callApi<E extends EndpointSpec>(
  endpoint: E,
  ...args: CallArgs<E>
): Promise<ResponseOf<E>> {
  const [input, options] = args;
  const { params, query, body } = (input ?? {}) as Loose;
  const url = `${API_PREFIX}${buildPath(endpoint.path, params)}${buildQuery(query)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: endpoint.method.toUpperCase(),
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: options?.signal,
      keepalive: options?.keepalive,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'network_error', 'The API could not be reached.');
  }

  if (!response.ok) throw await toApiError(response);
  if (!endpoint.response) return undefined as ResponseOf<E>;
  return endpoint.response.parse(await response.json()) as ResponseOf<E>;
}
