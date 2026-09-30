export function registerHandlers(app) {
  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error, reqId: request.id }, 'Unhandled error');
    const statusCode = error.statusCode || 500;
    reply.status(statusCode).send({
      error: statusCode >= 500 ? 'Internal Server Error' : error.message,
      statusCode,
      reqId: request.id,
    });
  });

  app.setNotFoundHandler((request, reply) => {
    request.log.warn({ url: request.url, method: request.method }, 'Route not found');
    reply.status(404).send({
      error: 'Not Found',
      statusCode: 404,
      url: request.url,
    });
  });

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
}
