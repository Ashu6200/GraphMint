import fastify from 'fastify';
import { randomUUID } from 'node:crypto';
import { registerPlugins, registerHandlers } from '@graphmint/service-config';

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
  swaggerTitle: 'Core Service API',
  swaggerDescription: 'API documentation for GraphMint Core Service',
});

registerHandlers(app, { serviceName: 'core-service' });

export default app;
