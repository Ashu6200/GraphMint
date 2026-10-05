import { errorHandler } from './errorHandler.js';

export function registerHandlers(app) {
  app.setErrorHandler(errorHandler);

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
