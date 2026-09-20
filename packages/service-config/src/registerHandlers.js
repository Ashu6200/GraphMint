/**
 * Registers shared error handlers, lifecycle hooks, and /health route
 * on an existing Fastify instance.
 *
 * @param {import('fastify').FastifyInstance} app
 * @param {object} opts
 * @param {string} opts.serviceName - Used in /health response
 */
export function registerHandlers(app, { serviceName }) {
  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error, reqId: request.id }, 'Unhandled error');
    const statusCode = error.statusCode || 500;
    reply.status(statusCode).send({
      error: statusCode >= 500 ? 'Internal Server Error' : error.message,
      statusCode,
      reqId: request.id,
    });
  });

  // 404 handler
  app.setNotFoundHandler((request, reply) => {
    request.log.warn({ url: request.url, method: request.method }, 'Route not found');
    reply.status(404).send({
      error: 'Not Found',
      statusCode: 404,
      url: request.url,
    });
  });

  // Request/response lifecycle logging
  app.addHook('onRequest', async (request) => {
    request.log.info(
      { reqId: request.id, method: request.method, url: request.url },
      'incoming request'
    );
  });

  app.addHook('onResponse', async (request, reply) => {
    request.log.info(
      {
        reqId: request.id,
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: reply.elapsedTime,
      },
      'request completed'
    );
  });

  // Health check
  app.get('/health', async () => ({
    status: 'OK',
    service: serviceName,
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
}
