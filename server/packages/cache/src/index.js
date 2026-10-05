import RedisService from './redisService.js';

/**
 * Factory to create a configured RedisService instance
 * @param {object} options
 */
export function createRedisService(options = {}) {
  const url = options.url || process.env.REDIS_URL;
  let urlConfig = {};
  if (url) {
    try {
      const parsed = new URL(url);
      urlConfig = {
        host: parsed.hostname,
        port: Number(parsed.port) || 6379,
        username: parsed.username || undefined,
        password: parsed.password || undefined,
        db:
          parsed.pathname && parsed.pathname.length > 1 ? Number(parsed.pathname.slice(1)) || 0 : 0,
      };
    } catch {
      // fallback if url parsing fails
    }
  }

  return new RedisService({
    host: options.host || process.env.REDIS_HOST || urlConfig.host || '127.0.0.1',
    port: Number(options.port || process.env.REDIS_PORT || urlConfig.port || 6379),
    username: options.username || process.env.REDIS_USERNAME || urlConfig.username,
    password: options.password || process.env.REDIS_PASSWORD || urlConfig.password,
    db: Number(options.db ?? process.env.REDIS_DB ?? urlConfig.db ?? 0),
    namespace: options.namespace || process.env.SERVICE_NAME || 'app',
    ...options,
  });
}

export { RedisService };
export { default as redisPlugin } from './plugin.js';
export default RedisService;
