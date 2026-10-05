import fp from 'fastify-plugin';
import { createPrismaClient } from './index.js';

async function prismaPlugin(fastify, options = {}) {
  const prisma = options.prisma || createPrismaClient(options);

  if (!fastify.hasDecorator('prisma')) {
    fastify.decorate('prisma', prisma);
  }

  if (!fastify.hasRequestDecorator('prisma')) {
    fastify.decorateRequest('prisma', {
      getter() {
        return this.server.prisma;
      },
    });
  }

  fastify.addHook('onClose', async (server) => {
    server.log?.info?.('[Prisma] Closing database connection...');
    await Promise.allSettled([server.prisma?.$disconnect?.(), server.prisma?.$pool?.end?.()]);
  });
}

export default fp(prismaPlugin, {
  name: 'prisma',
  fastify: '5.x',
});
