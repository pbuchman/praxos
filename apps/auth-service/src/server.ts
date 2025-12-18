import Fastify, { type FastifyInstance } from 'fastify';
import type { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { praxosFastifyPlugin } from '@praxos/common';

const SERVICE_NAME = 'auth-service';
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
  if (checks.some((c) => c.status === 'down')) return 'down';
  if (checks.some((c) => c.status === 'degraded')) return 'degraded';
  return 'ok';
}

function buildOpenApiOptions(): FastifyDynamicSwaggerOptions {
  return {
    openapi: {
      info: {
        title: SERVICE_NAME,
        description: 'PraxOS service scaffolding (Step 4)',
        version: SERVICE_VERSION,
      },
      components: {},
      tags: [{ name: 'system', description: 'System endpoints' }],
    },
  };
}

export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  await app.register(praxosFastifyPlugin);

  await app.register(fastifySwagger, buildOpenApiOptions());
  await app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  });

  app.get('/openapi.json', async (_req, reply) => {
    const spec = app.swagger();
    return await reply.type('application/json').send(spec);
  });

  app.get('/health', async (_req, reply) => {
    const started = Date.now();
    const checks: HealthCheck[] = [checkSecrets(), checkFirestore()];
    const status = computeOverallStatus(checks);

    const response: HealthResponse = {
      status,
      serviceName: SERVICE_NAME,
      version: SERVICE_VERSION,
      timestamp: new Date().toISOString(),
      checks: checks.map((c) => c),
    };

    // include request duration as a header-level concern handled by logger;
    // health body stays contract-shaped
    void reply.header('x-health-duration-ms', String(Date.now() - started));
    return await reply.type('application/json').send(response);
  });

  return await Promise.resolve(app);
}
