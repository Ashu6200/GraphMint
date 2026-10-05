import fp from 'fastify-plugin';
import { createRedisService } from './index.js';

async function redisPlugin(fastify, options = {}) {
  const redis = options.redis || createRedisService(options);

  if (!fastify.hasDecorator('redis')) {
    fastify.decorate('redis', redis);
  }

  if (!fastify.hasRequestDecorator('redis')) {
    fastify.decorateRequest('redis', {
      getter() {
        return this.server.redis;
      },
    });
  }

  fastify.addHook('onClose', async (server) => {
    server.log?.info?.('[Redis] Closing cache connection...');
    await server.redis?.shutdown?.();
  });
}

export default fp(redisPlugin, {
  name: 'redis',
  fastify: '5.x',
});
