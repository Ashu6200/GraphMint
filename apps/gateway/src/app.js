import fastify from 'fastify';
import { randomUUID } from 'node:crypto';
import { registerPlugins, registerHandlers } from '@graphmint/service-config';
import proxy from '@fastify/http-proxy';

const app = fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
  },
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'reqId',
  genReqId(req) {
    return req.headers['x-request-id'] || randomUUID();
  },
});

await registerPlugins(app, {
  swaggerTitle: 'GraphMint Gateway API',
  swaggerDescription: 'API Gateway for GraphMint microservices',
  rateLimitMax: 200,
  helmetOptions: {
    contentSecurityPolicy: false,
    hsts: { maxAge: 31536000, includeSubDomains: true },
  },
  extraEnvSchema: {
    CORE_SERVICE_URL: { type: 'string', default: 'http://localhost:3001' },
    AI_SERVICE_URL: { type: 'string', default: 'http://localhost:3002' },
    IMPORT_EXPORT_SERVICE_URL: { type: 'string', default: 'http://localhost:3003' },
    PLATFORM_SERVICE_URL: { type: 'string', default: 'http://localhost:3004' },
  },
});

// Use gateway-specific handlers (502 instead of 500 for upstream errors)
registerHandlers(app, { serviceName: 'gateway' });

app.setErrorHandler((error, request, reply) => {
  request.log.error({ err: error, reqId: request.id }, 'Gateway error');
  const statusCode = error.statusCode || 502;
  reply.status(statusCode).send({
    error: statusCode >= 500 ? 'Bad Gateway' : error.message,
    statusCode,
    reqId: request.id,
  });
});

// Proxy routes — prefix stripped before forwarding; x-request-id propagated
await app.register(proxy, {
  upstream: app.config.CORE_SERVICE_URL,
  prefix: '/core',
  rewritePrefix: '',
  replyOptions: {
    rewriteRequestHeaders: (originalReq, headers) => ({
      ...headers,
      'x-request-id': originalReq.id,
    }),
  },
});

await app.register(proxy, {
  upstream: app.config.AI_SERVICE_URL,
  prefix: '/ai',
  rewritePrefix: '',
  replyOptions: {
    rewriteRequestHeaders: (originalReq, headers) => ({
      ...headers,
      'x-request-id': originalReq.id,
    }),
  },
});

await app.register(proxy, {
  upstream: app.config.IMPORT_EXPORT_SERVICE_URL,
  prefix: '/import-export',
  rewritePrefix: '',
  replyOptions: {
    rewriteRequestHeaders: (originalReq, headers) => ({
      ...headers,
      'x-request-id': originalReq.id,
    }),
  },
});

await app.register(proxy, {
  upstream: app.config.PLATFORM_SERVICE_URL,
  prefix: '/platform',
  rewritePrefix: '',
  replyOptions: {
    rewriteRequestHeaders: (originalReq, headers) => ({
      ...headers,
      'x-request-id': originalReq.id,
    }),
  },
});

export default app;
