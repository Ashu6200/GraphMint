import { randomUUID } from 'node:crypto';
import { registerHandlers, registerPlugins } from '@graphmint/service-config';
import fastify from 'fastify';

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
  swaggerTitle: 'Platform Service API',
  swaggerDescription: 'API documentation for GraphMint Platform Service',
});

registerHandlers(app, { serviceName: 'platform-service' });

app.get('/health', async () => ({
  status: 'OK',
  service: 'platform-service',
  version: process.env.npm_package_version || '1.0.0',
  uptime: Math.floor(process.uptime()),
  timestamp: new Date().toISOString(),
  memory: {
    heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
    unit: 'MB',
  },
}));

export default app;
