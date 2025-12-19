import type { FastifyPluginCallback, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import {
  deviceStartRequestSchema,
  devicePollRequestSchema,
  isAuth0Error,
  type DeviceStartResponse,
  type TokenResponse,
  type AuthConfigResponse,
} from './schemas.js';
import { postFormUrlEncoded, toFormUrlEncodedBody } from './httpClient.js';

/**
 * Auth0 configuration from environment.
 */
interface Auth0Config {
  domain: string;
  clientId: string;
  audience: string;
  jwksUrl: string;
  issuer: string;
}

/**
 * Load Auth0 config from environment.
 * Returns null if required vars are missing.
 */
function loadAuth0Config(): Auth0Config | null {
  const domain = process.env['AUTH0_DOMAIN'];
  const clientId = process.env['AUTH0_CLIENT_ID'];
  const audience = process.env['AUTH_AUDIENCE'];

  if (
    domain === undefined ||
    domain === '' ||
    clientId === undefined ||
    clientId === '' ||
    audience === undefined ||
    audience === ''
  ) {
    return null;
  }

  return {
    domain,
    clientId,
    audience,
    jwksUrl: `https://${domain}/.well-known/jwks.json`,
    issuer: `https://${domain}/`,
  };
}

/**
 * Handle Zod validation errors.
 */
function handleValidationError(error: ZodError, reply: FastifyReply): FastifyReply {
  const details = error.errors.map((e) => ({
    path: e.path.join('.'),
    message: e.message,
  }));
  return reply.fail('INVALID_REQUEST', 'Validation failed', undefined, {
    errors: details,
  });
}

/**
 * V1 auth routes plugin.
 * Implements Device Authorization Flow helpers.
 */
export const v1AuthRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
  // POST /v1/auth/device/start
  fastify.post(
    '/v1/auth/device/start',
    {
      schema: {
        description: 'Start Device Authorization Flow. Returns device code and user code.',
        tags: ['auth'],
        body: {
          type: 'object',
          properties: {
            audience: { type: 'string', format: 'uri', description: 'API audience identifier' },
            scope: {
              type: 'string',
              description: 'OAuth scopes',
              default: 'openid profile email',
            },
          },
        },
        response: {
          200: {
            description: 'Device code issued successfully',
            type: 'object',
            properties: {
              success: { type: 'boolean', enum: [true] },
              data: {
                type: 'object',
                properties: {
                  device_code: { type: 'string' },
                  user_code: { type: 'string' },
                  verification_uri: { type: 'string' },
                  verification_uri_complete: { type: 'string' },
                  expires_in: { type: 'number' },
                  interval: { type: 'number' },
                },
                required: [
                  'device_code',
                  'user_code',
                  'verification_uri',
                  'verification_uri_complete',
                  'expires_in',
                  'interval',
                ],
              },
              diagnostics: { $ref: 'Diagnostics#' },
            },
          },
          503: {
            description: 'Service misconfigured',
            type: 'object',
            properties: {
              success: { type: 'boolean', enum: [false] },
              error: { $ref: 'ErrorBody#' },
              diagnostics: { $ref: 'Diagnostics#' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const config = loadAuth0Config();
      if (config === null) {
        return await reply.fail(
          'MISCONFIGURED',
          'Auth0 is not configured. Set AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH_AUDIENCE.'
        );
      }

      const parseResult = deviceStartRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        return await handleValidationError(parseResult.error, reply);
      }

      const { audience, scope } = parseResult.data;
      const effectiveAudience = audience ?? config.audience;

      const deviceCodeUrl = `https://${config.domain}/oauth/device/code`;

      const formBody = [
        `client_id=${encodeURIComponent(config.clientId)}`,
        `audience=${encodeURIComponent(effectiveAudience)}`,
        `scope=${encodeURIComponent(scope)}`,
      ].join('&');

      try {
        const httpRes = await postFormUrlEncoded(deviceCodeUrl, formBody);

        const responseBody: unknown = httpRes.body;

        if (httpRes.status < 200 || httpRes.status >= 300) {
          if (isAuth0Error(responseBody)) {
            return await reply.fail(
              'DOWNSTREAM_ERROR',
              responseBody.error_description ?? responseBody.error,
              {
                downstreamStatus: httpRes.status,
                endpointCalled: deviceCodeUrl,
              }
            );
          }
          return await reply.fail('DOWNSTREAM_ERROR', 'Auth0 device code request failed', {
            downstreamStatus: httpRes.status,
            endpointCalled: deviceCodeUrl,
          });
        }

        const data = responseBody as DeviceStartResponse;
        return await reply.ok(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return await reply.fail('DOWNSTREAM_ERROR', `Auth0 request failed: ${message}`, {
          endpointCalled: deviceCodeUrl,
        });
      }
    }
  );

  // POST /v1/auth/device/poll
  fastify.post(
    '/v1/auth/device/poll',
    {
      schema: {
        description:
          'Poll for token after user authorization. Returns CONFLICT (409) if authorization pending.',
        tags: ['auth'],
        body: {
          type: 'object',
          required: ['device_code'],
          properties: {
            device_code: { type: 'string', minLength: 1 },
          },
        },
        response: {
          200: {
            description: 'Token issued successfully',
            type: 'object',
            properties: {
              success: { type: 'boolean', enum: [true] },
              data: {
                type: 'object',
                properties: {
                  access_token: { type: 'string' },
                  token_type: { type: 'string' },
                  expires_in: { type: 'number' },
                  scope: { type: 'string' },
                  id_token: { type: 'string' },
                },
                required: ['access_token', 'token_type', 'expires_in'],
              },
              diagnostics: { $ref: 'Diagnostics#' },
            },
          },
          409: {
            description: 'Authorization pending',
            type: 'object',
            properties: {
              success: { type: 'boolean', enum: [false] },
              error: { $ref: 'ErrorBody#' },
              diagnostics: { $ref: 'Diagnostics#' },
            },
          },
          503: {
            description: 'Service misconfigured',
            type: 'object',
            properties: {
              success: { type: 'boolean', enum: [false] },
              error: { $ref: 'ErrorBody#' },
              diagnostics: { $ref: 'Diagnostics#' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const config = loadAuth0Config();
      if (config === null) {
        return await reply.fail(
          'MISCONFIGURED',
          'Auth0 is not configured. Set AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH_AUDIENCE.'
        );
      }

      const parseResult = devicePollRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        return await handleValidationError(parseResult.error, reply);
      }

      const { device_code } = parseResult.data;
      const tokenUrl = `https://${config.domain}/oauth/token`;

      const formBody = toFormUrlEncodedBody({
        client_id: config.clientId,
        device_code,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      });

      try {
        const httpRes = await postFormUrlEncoded(tokenUrl, formBody);

        const responseBody: unknown = httpRes.body;

        if (httpRes.status < 200 || httpRes.status >= 300) {
          if (isAuth0Error(responseBody)) {
            const errorCode = responseBody.error;

            // authorization_pending: user hasn't authorized yet
            // slow_down: polling too fast
            if (errorCode === 'authorization_pending' || errorCode === 'slow_down') {
              const message =
                errorCode === 'authorization_pending'
                  ? 'Authorization pending. User has not yet completed authentication.'
                  : 'Polling too fast. Increase interval between requests.';
              return await reply.fail('CONFLICT', message, {
                downstreamStatus: httpRes.status,
                endpointCalled: tokenUrl,
              });
            }

            // expired_token, access_denied, etc.
            return await reply.fail(
              'DOWNSTREAM_ERROR',
              responseBody.error_description ?? responseBody.error,
              {
                downstreamStatus: httpRes.status,
                endpointCalled: tokenUrl,
              }
            );
          }
          return await reply.fail('DOWNSTREAM_ERROR', 'Auth0 token request failed', {
            downstreamStatus: httpRes.status,
            endpointCalled: tokenUrl,
          });
        }

        const data = responseBody as TokenResponse;
        return await reply.ok(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return await reply.fail('DOWNSTREAM_ERROR', `Auth0 request failed: ${message}`, {
          endpointCalled: tokenUrl,
        });
      }
    }
  );

  // GET /v1/auth/config
  fastify.get(
    '/v1/auth/config',
    {
      schema: {
        description: 'Get non-secret auth configuration for troubleshooting.',
        tags: ['auth'],
        response: {
          200: {
            description: 'Auth configuration',
            type: 'object',
            properties: {
              success: { type: 'boolean', enum: [true] },
              data: {
                type: 'object',
                properties: {
                  domain: { type: 'string' },
                  issuer: { type: 'string' },
                  audience: { type: 'string' },
                  jwksUrl: { type: 'string' },
                },
                required: ['domain', 'issuer', 'audience', 'jwksUrl'],
              },
              diagnostics: { $ref: 'Diagnostics#' },
            },
          },
          503: {
            description: 'Service misconfigured',
            type: 'object',
            properties: {
              success: { type: 'boolean', enum: [false] },
              error: { $ref: 'ErrorBody#' },
              diagnostics: { $ref: 'Diagnostics#' },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      const config = loadAuth0Config();
      if (config === null) {
        return await reply.fail(
          'MISCONFIGURED',
          'Auth0 is not configured. Set AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH_AUDIENCE.'
        );
      }

      const data: AuthConfigResponse = {
        domain: config.domain,
        issuer: config.issuer,
        audience: config.audience,
        jwksUrl: config.jwksUrl,
      };

      return await reply.ok(data);
    }
  );

  done();
};
