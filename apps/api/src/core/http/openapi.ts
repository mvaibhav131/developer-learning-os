import { z } from 'zod';
import { API_PREFIX, apiErrorSchema, endpoints, type EndpointSpec } from '@dlos/shared';

type JsonObject = Record<string, unknown>;

function toJsonSchema(schema: z.ZodType, io: 'input' | 'output'): JsonObject {
  const result = z.toJSONSchema(schema, {
    target: 'openapi-3.0',
    io,
    unrepresentable: 'any',
  }) as JsonObject;
  delete result.$schema;
  return result;
}

function parametersOf(schema: z.ZodType | undefined, location: 'path' | 'query'): JsonObject[] {
  if (!schema) return [];
  const json = toJsonSchema(schema, 'output');
  const properties = (json.properties ?? {}) as Record<string, JsonObject>;
  const required = new Set((json.required as string[] | undefined) ?? []);
  return Object.entries(properties).map(([name, property]) => ({
    name,
    in: location,
    required: location === 'path' ? true : required.has(name),
    schema: property,
  }));
}

function operationOf(endpoint: EndpointSpec): JsonObject {
  const status = String(endpoint.status ?? 200);
  const responses: Record<string, JsonObject> = {
    [status]: endpoint.response
      ? {
          description: 'Success',
          content: { 'application/json': { schema: toJsonSchema(endpoint.response, 'output') } },
        }
      : { description: 'Success, no content' },
    default: {
      description: 'Error',
      content: { 'application/json': { schema: toJsonSchema(apiErrorSchema, 'output') } },
    },
  };

  const operation: JsonObject = {
    operationId: endpoint.id,
    summary: endpoint.summary,
    tags: [...endpoint.tags],
    parameters: [...parametersOf(endpoint.params, 'path'), ...parametersOf(endpoint.query, 'query')],
    responses,
  };
  if (endpoint.description) operation.description = endpoint.description;
  if (endpoint.body) {
    operation.requestBody = {
      required: true,
      content: { 'application/json': { schema: toJsonSchema(endpoint.body, 'input') } },
    };
  }
  return operation;
}

export function buildOpenApiDocument(version: string): JsonObject {
  const paths: Record<string, JsonObject> = {};
  for (const endpoint of endpoints as readonly EndpointSpec[]) {
    const openApiPath = `${API_PREFIX}${endpoint.path.replace(/:([A-Za-z0-9_]+)/g, '{$1}')}`;
    paths[openApiPath] = { ...paths[openApiPath], [endpoint.method]: operationOf(endpoint) };
  }
  return {
    openapi: '3.0.3',
    info: {
      title: 'Developer Learning OS API',
      version,
      description:
        'Local-first REST API. Every request and response is validated against the Zod contracts in @dlos/shared. Single local profile, no authentication: bind to localhost only.',
      license: { name: 'MIT' },
    },
    servers: [{ url: '/' }],
    tags: [...new Set(endpoints.flatMap((endpoint) => endpoint.tags))].map((name) => ({ name })),
    paths,
  };
}
