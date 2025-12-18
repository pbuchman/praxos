import Fastify, { type FastifyInstance } from 'fastify';
import type { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { praxosFastifyPlugin } from '@praxos/common';

const SERVICE_NAME = 'notion-gpt-service';
const SERVICE_VERSION = '0.0.1';

type HealthStatus = 'ok' | 'degraded' | 'down';

interface HealthCheck {
  name: string;
  status: HealthStatus;
  latencyMs: number;
  details: Record<string, unknown> | null;
}

interface HealthResponse {
  status: HealthStatus;
  serviceName: string;
  version: string;
  timestamp: string;
  checks: HealthCheck[];
}

function checkSecrets(): HealthCheck {
  const start = Date.now();
  return {
    name: 'secrets',
    status: 'ok',
    latencyMs: Date.now() - start,
    details: null,
  };
}

function checkNotion(): HealthCheck {
  const start = Date.now();
  return {
    name: 'notion',
    status: 'ok',
    latencyMs: Date.now() - start,
    details: null,
  };
}

function checkFirestore(): HealthCheck {
  const start = Date.now();
  return {
    name: 'firestore',
    status: 'ok',
    latencyMs: Date.now() - start,
    details: null,
  };
}

function computeOverallStatus(checks: HealthCheck[]): HealthStatus {
  const hasDown = checks.some((c) => c.status === 'down');
  if (hasDown) {
    return 'down';
  }
  const hasDegraded = checks.some((c) => c.status === 'degraded');
  if (hasDegraded) {
    return 'degraded';
  }
  return 'ok';
}

export async function createServer(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: true,
  });

  await server.register(praxosFastifyPlugin);

  const swaggerOptions: FastifyDynamicSwaggerOptions = {
    openapi: {
      info: {
        title: 'Notion GPT Service API',
        description: 'PraxOS Notion Integration Service for GPT Actions',
        version: SERVICE_VERSION,
      },
      components: {
        schemas: {
          ApiOk: {
            type: 'object',
            properties: {
              success: { type: 'boolean', enum: [true] },
              data: { type: 'object' },
              diagnostics: { $ref: '#/components/schemas/Diagnostics' },
            },
          },
          ApiError: {
            type: 'object',
            properties: {
              success: { type: 'boolean', enum: [false] },
              error: { $ref: '#/components/schemas/ErrorBody' },
              diagnostics: { $ref: '#/components/schemas/Diagnostics' },
            },
          },
          ErrorBody: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' },
            },
          },
          Diagnostics: {
            type: 'object',
            properties: {
              requestId: { type: 'string' },
              durationMs: { type: 'number' },
              downstreamStatus: { type: 'integer' },
              downstreamRequestId: { type: 'string' },
              endpointCalled: { type: 'string' },
            },
          },
          HealthResponse: {
            type: 'object',
            required: ['status', 'serviceName', 'version', 'timestamp', 'checks'],
            properties: {
              status: { type: 'string', enum: ['ok', 'degraded', 'down'] },
              serviceName: { type: 'string' },
              version: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
              checks: {
                type: 'array',
                items: { $ref: '#/components/schemas/HealthCheck' },
              },
            },
          },
          HealthCheck: {
            type: 'object',
            required: ['name', 'status', 'latencyMs'],
            properties: {
              name: { type: 'string' },
              status: { type: 'string', enum: ['ok', 'degraded', 'down'] },
              latencyMs: { type: 'number' },
              details: { type: 'object', nullable: true },
            },
          },
        },
      },
    },
  };

  await server.register(fastifySwagger, swaggerOptions);

  await server.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  });

  server.get<{ Reply: HealthResponse }>(
    '/health',
    {
      schema: {
        description: 'Health check endpoint',
        tags: ['health'],
        response: {
          200: { $ref: '#/components/schemas/HealthResponse' },
        },
      },
    },
    async (_request, reply) => {
      const checks = [checkSecrets(), checkNotion(), checkFirestore()];
      const status = computeOverallStatus(checks);

      const response: HealthResponse = {
        status,
        serviceName: SERVICE_NAME,
        version: SERVICE_VERSION,
        timestamp: new Date().toISOString(),
        checks,
      };

      return await reply.status(status === 'down' ? 503 : 200).send(response);
    }
  );

  server.get(
    '/openapi.json',
    {
      schema: {
        description: 'OpenAPI specification',
        tags: ['docs'],
        hide: true,
      },
    },
    async (_request, reply) => {
      return await reply.send(server.swagger());
    }
  );

  return await server;
}
