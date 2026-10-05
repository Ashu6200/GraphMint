import './env.js';

export { registerPlugins } from './registerPlugins.js';
export { registerHandlers } from './registerHandlers.js';
export { errorHandler } from './errorHandler.js';
export { createServer } from './createServer.js';
export {
  validatorCompiler,
  serializerCompiler,
  jsonSchemaTransform,
  hasZodFastifySchemaValidationErrors,
} from '@fastify/type-provider-zod';
export { z, ZodError } from 'zod';
