import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

const app = fastify({
  logger: {
    transport: process.env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
  },
});

// Register plugins
await app.register(cors, {
  origin: '*',
});

await app.register(helmet);

await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

// Register Swagger
await app.register(swagger, {
  openapi: {
    info: {
      title: 'AI Service API',
      description: 'API documentation for GraphMint AI Service',
      version: '1.0.0',
    },
  },
});

await app.register(swaggerUi, {
  routePrefix: '/docs',
});

// Health check route
app.get('/health', async () => {
  return { status: 'OK', service: 'ai-service' };
});

export default app;
