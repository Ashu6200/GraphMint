import cors from '@fastify/cors';
import fastifyEnv from '@fastify/env';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

const BASE_ENV_SCHEMA = {
  PORT: { type: 'string', default: '3000' },
  NODE_ENV: { type: 'string', default: 'development' },
  LOG_LEVEL: { type: 'string', default: 'info' },
  CORS_ORIGINS: { type: 'string', default: '' },
};

const DEFAULT_HELMET_OPTIONS = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: { maxAge: 31536000, includeSubDomains: true },
};

export async function registerPlugins(
  app,
  { swaggerTitle, swaggerDescription, rateLimitMax = 100, helmetOptions, extraEnvSchema = {} }
) {
  await app.register(fastifyEnv, {
    schema: {
      type: 'object',
      required: ['PORT', 'NODE_ENV'],
      properties: { ...BASE_ENV_SCHEMA, ...extraEnvSchema },
    },
  });

  await app.register(helmet, helmetOptions ?? DEFAULT_HELMET_OPTIONS);

  await app.register(cors, {
    origin(origin, cb) {
      const allowed = app.config.CORS_ORIGINS
        ? app.config.CORS_ORIGINS.split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      if (!origin || allowed.includes(origin) || app.config.NODE_ENV === 'development') {
        return cb(null, true);
      }
      return cb(new Error('CORS: origin not allowed'), false);
    },
    credentials: true,
  });

  await app.register(rateLimit, {
    max: rateLimitMax,
    timeWindow: '1 minute',
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: swaggerTitle,
        description: swaggerDescription,
        version: '1.0.0',
      },
    },
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });
}
