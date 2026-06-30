import fastify from 'fastify';

const app = fastify({
  logger: {
    transport: process.env.NODE_ENV === 'development' ? 'pino-pretty' : undefined,
  },
});

export default app;
