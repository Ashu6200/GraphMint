import crypto from 'node:crypto';
import Redis from 'ioredis';

class RedisService {
  constructor({
    namespace = 'core',
    keyPrefix = '',
    host,
    redisHost,
    port,
    redisPort,
    username,
    redisUsername,
    password,
    redisPassword,
    db,
    redisDB,
    tls = false,
    enableReadyCheck = true,
    enableOfflineQueue = true,
    lazyConnect = false,
    maxRetriesPerRequest = null,
    options = {},
    logger = console,
    redlock = null,
  } = {}) {
    this.namespace = namespace;
    this.keyPrefix = keyPrefix;
    this.logger = logger;
    this.options = options;

    this.host = host || redisHost || '127.0.0.1';
    this.port = Number(port || redisPort || 6379);
    this.username = username || redisUsername;
    this.password = password || redisPassword;
    this.db = Number(db || redisDB || 0);
    this.tls = tls;

    this.enableReadyCheck = enableReadyCheck;
    this.enableOfflineQueue = enableOfflineQueue;
    this.lazyConnect = lazyConnect;
    this.maxRetriesPerRequest = maxRetriesPerRequest;

    this.client = null;
    this.subscriber = null;
    this.publisher = null;
    this.redlock = redlock;

    this._isConnected = false;
    this._subCallbacks = new Map();
    this._psubCallbacks = new Map();

    this._init();
  }

  key(rawKey) {
    if (rawKey === undefined || rawKey === null) return '';
    const prefix = this.keyPrefix ? `${this.keyPrefix}:` : '';
    return `${prefix}${this.namespace}:${String(rawKey).trim()}`;
  }

  rawKey(fullKey) {
    if (!fullKey) return '';
    const prefix = this.keyPrefix ? `${this.keyPrefix}:` : '';
    const nsPrefix = `${prefix}${this.namespace}:`;
    return fullKey.startsWith(nsPrefix) ? fullKey.slice(nsPrefix.length) : fullKey;
  }

  _init() {
    this._createClient();
    this._setupPubSub();
    this._registerEvents();
  }

  _baseOptions(extra = {}) {
    const serviceLogger = this.logger;
    return {
      host: this.host,
      port: this.port,
      username: this.username,
      password: this.password,
      db: this.db,
      maxRetriesPerRequest: this.maxRetriesPerRequest,
      enableReadyCheck: this.enableReadyCheck,
      enableOfflineQueue: this.enableOfflineQueue,
      lazyConnect: this.lazyConnect,
      retryStrategy(times) {
        const maxAttempts = 10;
        if (times >= maxAttempts) {
          serviceLogger.error(
            `[RedisService] Redis reconnect attempts exceeded (${maxAttempts}). Stopping retry.`
          );
          return null;
        }
        const delay = Math.min(times * 100, 3000);
        serviceLogger.warn(`[RedisService] Reconnecting to Redis (attempt ${times})...`);
        return delay;
      },
      ...(this.tls && { tls: typeof this.tls === 'object' ? this.tls : {} }),
      ...extra,
    };
  }

  _createClient() {
    this.client = new Redis({
      ...this._baseOptions(),
      ...this.options,
    });
    this.logger.info?.('[RedisService] Redis client initialized');
  }

  _setupPubSub() {
    this.publisher = this.client.duplicate();
    this.subscriber = this.client.duplicate();

    this.publisher.on('error', (err) => {
      this.logger.error?.('[RedisService] Publisher error:', err.message || err);
    });

    this.subscriber.on('error', (err) => {
      this.logger.error?.('[RedisService] Subscriber error:', err.message || err);
    });

    this.subscriber.on('message', (chan, msg) => {
      const rawChan = this.rawKey(chan).replace(/^channel:/, '');
      const callbacks = this._subCallbacks.get(rawChan);
      if (callbacks && callbacks.size > 0) {
        let parsed = msg;
        try {
          parsed = JSON.parse(msg);
        } catch (e) {
          this.logger.error(e);
        }
        for (const cb of callbacks) {
          try {
            cb(parsed, rawChan);
          } catch (cbErr) {
            this.logger.error?.('[RedisService] Subscriber callback error:', cbErr);
          }
        }
      }
    });

    this.subscriber.on('pmessage', (pattern, chan, msg) => {
      const rawPattern = this.rawKey(pattern).replace(/^channel:/, '');
      const rawChan = this.rawKey(chan).replace(/^channel:/, '');
      const callbacks = this._psubCallbacks.get(rawPattern);
      if (callbacks && callbacks.size > 0) {
        let parsed = msg;
        try {
          parsed = JSON.parse(msg);
        } catch (e) {
          this.logger.error(e);
        }
        for (const cb of callbacks) {
          try {
            cb(parsed, rawChan, rawPattern);
          } catch (cbErr) {
            this.logger.error?.('[RedisService] Pattern Subscriber callback error:', cbErr);
          }
        }
      }
    });
  }

  _registerEvents() {
    this.client.on('connect', () => {
      this.logger.info?.('[RedisService] Connected to Redis');
    });

    this.client.on('ready', () => {
      this._isConnected = true;
      this.logger.info?.('[RedisService] Redis client ready');
    });

    this.client.on('error', (err) => {
      this._isConnected = false;
      this.logger.error?.('[RedisService] Redis connection error:', err.message || err);
    });

    this.client.on('close', () => {
      this._isConnected = false;
      this.logger.warn?.('[RedisService] Redis connection closed');
    });

    this.client.on('reconnecting', () => {
      this.logger.warn?.('[RedisService] Redis reconnecting...');
    });

    this.client.on('end', () => {
      this._isConnected = false;
      this.logger.warn?.('[RedisService] Redis connection ended');
    });
  }

  isConnected() {
    return this._isConnected;
  }

  getClient() {
    return this.client;
  }

  getPublisher() {
    return this.publisher;
  }

  getSubscriber() {
    return this.subscriber;
  }

  getBullConnection(extra = {}) {
    return new Redis({
      ...this._baseOptions({
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
        ...extra,
      }),
    });
  }

  duplicate(overrideOptions = {}) {
    return this.client.duplicate(overrideOptions);
  }

  async ping() {
    try {
      return await this.client.ping();
    } catch (err) {
      this.logger.error?.('[RedisService] ping failed:', err);
      throw err;
    }
  }

  async info(section = 'default') {
    try {
      return await this.client.info(section);
    } catch (err) {
      this.logger.error?.('[RedisService] info failed:', err);
      throw err;
    }
  }

  async dbsize() {
    try {
      return await this.client.dbsize();
    } catch (err) {
      this.logger.error?.('[RedisService] dbsize failed:', err);
      throw err;
    }
  }

  async shutdown() {
    try {
      this.logger.info?.('[RedisService] Shutting down Redis connections...');
      await Promise.allSettled([
        this.publisher?.quit(),
        this.subscriber?.quit(),
        this.client?.quit(),
      ]);
      this._isConnected = false;
      this.logger.info?.('[RedisService] Shutdown completed');
    } catch (err) {
      this.logger.error?.('[RedisService] Shutdown error:', err);
    }
  }

  async exists(...keys) {
    try {
      const flatKeys = keys.flat().map((k) => this.key(k));
      if (flatKeys.length === 0) return 0;
      return await this.client.exists(...flatKeys);
    } catch (err) {
      this.logger.error?.('[RedisService] exists failed:', err);
      throw err;
    }
  }

  async expire(key, ttlSeconds) {
    try {
      return await this.client.expire(this.key(key), ttlSeconds);
    } catch (err) {
      this.logger.error?.(`[RedisService] expire failed for key=${key}:`, err);
      throw err;
    }
  }

  async expireAt(key, unixTimestampSeconds) {
    try {
      return await this.client.expireat(this.key(key), unixTimestampSeconds);
    } catch (err) {
      this.logger.error?.(`[RedisService] expireAt failed for key=${key}:`, err);
      throw err;
    }
  }

  async pexpire(key, ttlMilliseconds) {
    try {
      return await this.client.pexpire(this.key(key), ttlMilliseconds);
    } catch (err) {
      this.logger.error?.(`[RedisService] pexpire failed for key=${key}:`, err);
      throw err;
    }
  }

  async ttl(key) {
    try {
      return await this.client.ttl(this.key(key));
    } catch (err) {
      this.logger.error?.(`[RedisService] ttl failed for key=${key}:`, err);
      throw err;
    }
  }

  async pttl(key) {
    try {
      return await this.client.pttl(this.key(key));
    } catch (err) {
      this.logger.error?.(`[RedisService] pttl failed for key=${key}:`, err);
      throw err;
    }
  }

  async persist(key) {
    try {
      return await this.client.persist(this.key(key));
    } catch (err) {
      this.logger.error?.(`[RedisService] persist failed for key=${key}:`, err);
      throw err;
    }
  }

  async type(key) {
    try {
      return await this.client.type(this.key(key));
    } catch (err) {
      this.logger.error?.(`[RedisService] type failed for key=${key}:`, err);
      throw err;
    }
  }

  async touch(...keys) {
    try {
      const flatKeys = keys.flat().map((k) => this.key(k));
      if (flatKeys.length === 0) return 0;
      return await this.client.touch(...flatKeys);
    } catch (err) {
      this.logger.error?.('[RedisService] touch failed:', err);
      throw err;
    }
  }

  async rename(oldKey, newKey) {
    try {
      return await this.client.rename(this.key(oldKey), this.key(newKey));
    } catch (err) {
      this.logger.error?.(`[RedisService] rename failed: ${err.message}`);
      throw err;
    }
  }

  async renamenx(oldKey, newKey) {
    try {
      return await this.client.renamenx(this.key(oldKey), this.key(newKey));
    } catch (err) {
      this.logger.error?.(`[RedisService] renamenx failed: ${err.message}`);
      throw err;
    }
  }

  async del(...keys) {
    try {
      const flatKeys = keys
        .flat()
        .filter(Boolean)
        .map((k) => this.key(k));
      if (flatKeys.length === 0) return 0;
      return await this.client.del(...flatKeys);
    } catch (err) {
      this.logger.error?.('[RedisService] del failed:', err);
      throw err;
    }
  }

  async unlink(...keys) {
    try {
      const flatKeys = keys
        .flat()
        .filter(Boolean)
        .map((k) => this.key(k));
      if (flatKeys.length === 0) return 0;
      return await this.client.unlink(...flatKeys);
    } catch (err) {
      this.logger.error?.('[RedisService] unlink failed:', err);
      throw err;
    }
  }

  async delByPattern(pattern, batchSize = 100) {
    try {
      const prefix = this.keyPrefix ? `${this.keyPrefix}:` : '';
      const fullPattern = `${prefix}${this.namespace}:${pattern}`;
      let cursor = '0';
      let deleted = 0;
      do {
        const [newCursor, keys] = await this.client.scan(
          cursor,
          'MATCH',
          fullPattern,
          'COUNT',
          batchSize
        );
        cursor = newCursor;
        if (keys.length > 0) {
          await this.client.unlink(...keys);
          deleted += keys.length;
        }
      } while (cursor !== '0');
      return deleted;
    } catch (err) {
      this.logger.error?.(`[RedisService] delByPattern failed for pattern=${pattern}:`, err);
      throw err;
    }
  }

  async scan(cursor = '0', pattern = '*', count = 100) {
    try {
      const prefix = this.keyPrefix ? `${this.keyPrefix}:` : '';
      const fullPattern = `${prefix}${this.namespace}:${pattern}`;
      const [newCursor, keys] = await this.client.scan(
        cursor,
        'MATCH',
        fullPattern,
        'COUNT',
        count
      );
      return [newCursor, keys.map((k) => this.rawKey(k))];
    } catch (err) {
      this.logger.error?.('[RedisService] scan failed:', err);
      throw err;
    }
  }

  async keys(pattern = '*') {
    try {
      const prefix = this.keyPrefix ? `${this.keyPrefix}:` : '';
      const fullPattern = `${prefix}${this.namespace}:${pattern}`;
      const keys = await this.client.keys(fullPattern);
      return keys.map((k) => this.rawKey(k));
    } catch (err) {
      this.logger.error?.('[RedisService] keys failed:', err);
      throw err;
    }
  }

  async flushNamespace() {
    return this.delByPattern('*');
  }

  async flushDB() {
    try {
      return await this.client.flushdb();
    } catch (err) {
      this.logger.error?.('[RedisService] flushDB failed:', err);
      throw err;
    }
  }

  async get(key) {
    try {
      return await this.client.get(this.key(key));
    } catch (err) {
      this.logger.error?.(`[RedisService] get failed for key=${key}:`, err);
      throw err;
    }
  }

  async set(key, value, ttlSeconds = null, options = {}) {
    try {
      const redisKey = this.key(key);
      const strVal = typeof value === 'string' ? value : String(value);

      if (options.nx) {
        if (ttlSeconds) {
          return await this.client.set(redisKey, strVal, 'EX', ttlSeconds, 'NX');
        }
        return await this.client.set(redisKey, strVal, 'NX');
      }

      if (options.xx) {
        if (ttlSeconds) {
          return await this.client.set(redisKey, strVal, 'EX', ttlSeconds, 'XX');
        }
        return await this.client.set(redisKey, strVal, 'XX');
      }

      if (ttlSeconds) {
        return await this.client.set(redisKey, strVal, 'EX', ttlSeconds);
      }

      return await this.client.set(redisKey, strVal);
    } catch (err) {
      this.logger.error?.(`[RedisService] set failed for key=${key}:`, err);
      throw err;
    }
  }

  async setNX(key, value, ttlSeconds = null) {
    return this.set(key, value, ttlSeconds, { nx: true });
  }

  async setXX(key, value, ttlSeconds = null) {
    return this.set(key, value, ttlSeconds, { xx: true });
  }

  async getset(key, value) {
    try {
      return await this.client.getset(this.key(key), value);
    } catch (err) {
      this.logger.error?.(`[RedisService] getset failed for key=${key}:`, err);
      throw err;
    }
  }

  async getdel(key) {
    try {
      return await this.client.getdel(this.key(key));
    } catch (err) {
      this.logger.error?.(`[RedisService] getdel failed for key=${key}:`, err);
      throw err;
    }
  }

  async mget(...keys) {
    try {
      const flatKeys = keys.flat().map((k) => this.key(k));
      if (flatKeys.length === 0) return [];
      return await this.client.mget(...flatKeys);
    } catch (err) {
      this.logger.error?.('[RedisService] mget failed:', err);
      throw err;
    }
  }

  async mset(keyValueMap, ttlSeconds = null) {
    try {
      const entries = Object.entries(keyValueMap);
      if (entries.length === 0) return 'OK';

      if (ttlSeconds) {
        const pipe = this.client.pipeline();
        for (const [k, v] of entries) {
          pipe.set(this.key(k), typeof v === 'string' ? v : String(v), 'EX', ttlSeconds);
        }
        await pipe.exec();
        return 'OK';
      }

      const flat = [];
      for (const [k, v] of entries) {
        flat.push(this.key(k), typeof v === 'string' ? v : String(v));
      }
      return await this.client.mset(...flat);
    } catch (err) {
      this.logger.error?.('[RedisService] mset failed:', err);
      throw err;
    }
  }

  async incr(key, by = 1) {
    try {
      if (by === 1) return await this.client.incr(this.key(key));
      return await this.client.incrby(this.key(key), by);
    } catch (err) {
      this.logger.error?.(`[RedisService] incr failed for key=${key}:`, err);
      throw err;
    }
  }

  async decr(key, by = 1) {
    try {
      if (by === 1) return await this.client.decr(this.key(key));
      return await this.client.decrby(this.key(key), by);
    } catch (err) {
      this.logger.error?.(`[RedisService] decr failed for key=${key}:`, err);
      throw err;
    }
  }

  async incrby(key, amount) {
    return this.incr(key, amount);
  }

  async decrby(key, amount) {
    return this.decr(key, amount);
  }

  async incrbyfloat(key, amount) {
    try {
      return await this.client.incrbyfloat(this.key(key), amount);
    } catch (err) {
      this.logger.error?.(`[RedisService] incrbyfloat failed for key=${key}:`, err);
      throw err;
    }
  }

  async append(key, value) {
    try {
      return await this.client.append(this.key(key), value);
    } catch (err) {
      this.logger.error?.(`[RedisService] append failed for key=${key}:`, err);
      throw err;
    }
  }

  async strlen(key) {
    try {
      return await this.client.strlen(this.key(key));
    } catch (err) {
      this.logger.error?.(`[RedisService] strlen failed for key=${key}:`, err);
      throw err;
    }
  }

  async getJSON(key) {
    try {
      const data = await this.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      this.logger.error?.(`[RedisService] getJSON failed for key=${key}:`, err);
      throw err;
    }
  }

  async setJSON(key, value, ttlSeconds = null, options = {}) {
    try {
      const serialized = JSON.stringify(value);
      return await this.set(key, serialized, ttlSeconds, options);
    } catch (err) {
      this.logger.error?.(`[RedisService] setJSON failed for key=${key}:`, err);
      throw err;
    }
  }

  async setNXJSON(key, value, ttlSeconds = null) {
    return this.setJSON(key, value, ttlSeconds, { nx: true });
  }

  async mgetJSON(...keys) {
    try {
      const values = await this.mget(...keys);
      return values.map((v) => (v ? JSON.parse(v) : null));
    } catch (err) {
      this.logger.error?.('[RedisService] mgetJSON failed:', err);
      throw err;
    }
  }

  async msetJSON(keyValueMap, ttlSeconds = null) {
    try {
      const jsonMap = {};
      for (const [k, v] of Object.entries(keyValueMap)) {
        jsonMap[k] = JSON.stringify(v);
      }
      return await this.mset(jsonMap, ttlSeconds);
    } catch (err) {
      this.logger.error?.('[RedisService] msetJSON failed:', err);
      throw err;
    }
  }

  async getsetJSON(key, value) {
    try {
      const prev = await this.getset(key, JSON.stringify(value));
      return prev ? JSON.parse(prev) : null;
    } catch (err) {
      this.logger.error?.(`[RedisService] getsetJSON failed for key=${key}:`, err);
      throw err;
    }
  }

  async getdelJSON(key) {
    try {
      const val = await this.getdel(key);
      return val ? JSON.parse(val) : null;
    } catch (err) {
      this.logger.error?.(`[RedisService] getdelJSON failed for key=${key}:`, err);
      throw err;
    }
  }

  /**
   * Cache-Aside Pattern (Remember)
   */
  async remember(key, ttlSeconds, fetcherFn) {
    try {
      const cached = await this.getJSON(key);
      if (cached !== null) return cached;

      const fresh = await fetcherFn();
      if (fresh !== undefined) {
        await this.setJSON(key, fresh, ttlSeconds);
      }
      return fresh;
    } catch (err) {
      this.logger.error?.(`[RedisService] remember failed for key=${key}:`, err);
      throw err;
    }
  }

  /**
   * Cache Stampede / Thundering-Herd Safe Cache-Aside
   */
  async rememberSafe(key, ttlSeconds, fetcherFn, lockTtlSeconds = 5) {
    try {
      const cached = await this.getJSON(key);
      if (cached !== null) return cached;

      const lockKey = `lock:remember:${key}`;
      const lockToken = crypto.randomBytes(8).toString('hex');
      const acquired = await this.client.set(
        this.key(lockKey),
        lockToken,
        'NX',
        'EX',
        lockTtlSeconds
      );

      if (!acquired) {
        await new Promise((r) => setTimeout(r, 120));
        const retry = await this.getJSON(key);
        if (retry !== null) return retry;
        return fetcherFn();
      }

      try {
        const fresh = await fetcherFn();
        if (fresh !== undefined) {
          await this.setJSON(key, fresh, ttlSeconds);
        }
        return fresh;
      } finally {
        const releaseScript = `
                    if redis.call("get", KEYS[1]) == ARGV[1] then
                        return redis.call("del", KEYS[1])
                    else
                        return 0
                    end
                `;
        await this.client.eval(releaseScript, 1, this.key(lockKey), lockToken).catch(() => {});
      }
    } catch (err) {
      this.logger.error?.(`[RedisService] rememberSafe failed for key=${key}:`, err);
      throw err;
    }
  }

  /**
   * Stale-While-Revalidate (SWR) Pattern
   * Returns stale cached data immediately if available while fetching fresh in background
   */
  async swr(key, ttlSeconds, swrSeconds, fetcherFn) {
    try {
      const metaKey = `swr:meta:${key}`;
      const cached = await this.getJSON(key);
      const meta = await this.getJSON(metaKey);

      const now = Date.now();
      const isStale = !meta || now > meta.staleAt;

      if (cached !== null) {
        if (isStale) {
          (async () => {
            try {
              const fresh = await fetcherFn();
              if (fresh !== undefined) {
                await this.setJSON(key, fresh, ttlSeconds + swrSeconds);
                await this.setJSON(
                  metaKey,
                  { staleAt: Date.now() + ttlSeconds * 1000 },
                  ttlSeconds + swrSeconds
                );
              }
            } catch (bgErr) {
              this.logger.warn?.(
                `[RedisService] SWR background revalidate failed for key=${key}:`,
                bgErr
              );
            }
          })();
        }
        return cached;
      }

      const fresh = await fetcherFn();
      if (fresh !== undefined) {
        await this.setJSON(key, fresh, ttlSeconds + swrSeconds);
        await this.setJSON(
          metaKey,
          { staleAt: Date.now() + ttlSeconds * 1000 },
          ttlSeconds + swrSeconds
        );
      }
      return fresh;
    } catch (err) {
      this.logger.error?.(`[RedisService] swr failed for key=${key}:`, err);
      throw err;
    }
  }

  async hget(key, field) {
    try {
      return await this.client.hget(this.key(key), field);
    } catch (err) {
      this.logger.error?.(`[RedisService] hget failed for key=${key}, field=${field}:`, err);
      throw err;
    }
  }

  async hgetJSON(key, field) {
    try {
      const val = await this.hget(key, field);
      return val ? JSON.parse(val) : null;
    } catch (err) {
      this.logger.error?.(`[RedisService] hgetJSON failed for key=${key}, field=${field}:`, err);
      throw err;
    }
  }

  async hset(key, fieldOrObject, value) {
    try {
      const redisKey = this.key(key);
      if (typeof fieldOrObject === 'object' && fieldOrObject !== null) {
        return await this.client.hset(redisKey, fieldOrObject);
      }
      return await this.client.hset(redisKey, fieldOrObject, value);
    } catch (err) {
      this.logger.error?.(`[RedisService] hset failed for key=${key}:`, err);
      throw err;
    }
  }

  async hsetJSON(key, field, value) {
    return this.hset(key, field, JSON.stringify(value));
  }

  async hmset(key, objectMap) {
    try {
      return await this.client.hmset(this.key(key), objectMap);
    } catch (err) {
      this.logger.error?.(`[RedisService] hmset failed for key=${key}:`, err);
      throw err;
    }
  }

  async hmsetJSON(key, objectMap) {
    try {
      const serialized = {};
      for (const [k, v] of Object.entries(objectMap)) {
        serialized[k] = JSON.stringify(v);
      }
      return await this.hmset(key, serialized);
    } catch (err) {
      this.logger.error?.(`[RedisService] hmsetJSON failed for key=${key}:`, err);
      throw err;
    }
  }

  async hmget(key, ...fields) {
    try {
      const flatFields = fields.flat();
      return await this.client.hmget(this.key(key), ...flatFields);
    } catch (err) {
      this.logger.error?.(`[RedisService] hmget failed for key=${key}:`, err);
      throw err;
    }
  }

  async hmgetJSON(key, ...fields) {
    try {
      const values = await this.hmget(key, ...fields);
      return values.map((v) => (v ? JSON.parse(v) : null));
    } catch (err) {
      this.logger.error?.(`[RedisService] hmgetJSON failed for key=${key}:`, err);
      throw err;
    }
  }

  async hgetall(key) {
    try {
      return await this.client.hgetall(this.key(key));
    } catch (err) {
      this.logger.error?.(`[RedisService] hgetall failed for key=${key}:`, err);
      throw err;
    }
  }

  async hgetallJSON(key) {
    try {
      const raw = await this.hgetall(key);
      if (!raw || Object.keys(raw).length === 0) return null;
      const parsed = {};
      for (const [k, v] of Object.entries(raw)) {
        try {
          parsed[k] = JSON.parse(v);
        } catch {
          parsed[k] = v;
        }
      }
      return parsed;
    } catch (err) {
      this.logger.error?.(`[RedisService] hgetallJSON failed for key=${key}:`, err);
      throw err;
    }
  }

  async hdel(key, ...fields) {
    try {
      const flatFields = fields.flat();
      if (flatFields.length === 0) return 0;
      return await this.client.hdel(this.key(key), ...flatFields);
    } catch (err) {
      this.logger.error?.(`[RedisService] hdel failed for key=${key}:`, err);
      throw err;
    }
  }

  async hexists(key, field) {
    try {
      return await this.client.hexists(this.key(key), field);
    } catch (err) {
      this.logger.error?.(`[RedisService] hexists failed for key=${key}:`, err);
      throw err;
    }
  }

  async hincrby(key, field, amount = 1) {
    try {
      return await this.client.hincrby(this.key(key), field, amount);
    } catch (err) {
      this.logger.error?.(`[RedisService] hincrby failed for key=${key}:`, err);
      throw err;
    }
  }

  async hincrbyfloat(key, field, amount) {
    try {
      return await this.client.hincrbyfloat(this.key(key), field, amount);
    } catch (err) {
      this.logger.error?.(`[RedisService] hincrbyfloat failed for key=${key}:`, err);
      throw err;
    }
  }

  async hkeys(key) {
    try {
      return await this.client.hkeys(this.key(key));
    } catch (err) {
      this.logger.error?.(`[RedisService] hkeys failed for key=${key}:`, err);
      throw err;
    }
  }

  async hvals(key) {
    try {
      return await this.client.hvals(this.key(key));
    } catch (err) {
      this.logger.error?.(`[RedisService] hvals failed for key=${key}:`, err);
      throw err;
    }
  }

  async hlen(key) {
    try {
      return await this.client.hlen(this.key(key));
    } catch (err) {
      this.logger.error?.(`[RedisService] hlen failed for key=${key}:`, err);
      throw err;
    }
  }

  async lpush(key, ...values) {
    try {
      const flat = values.flat().map((v) => (typeof v === 'string' ? v : String(v)));
      if (flat.length === 0) return 0;
      return await this.client.lpush(this.key(key), ...flat);
    } catch (err) {
      this.logger.error?.(`[RedisService] lpush failed for key=${key}:`, err);
      throw err;
    }
  }

  async lpushJSON(key, ...values) {
    try {
      const flat = values.flat().map((v) => JSON.stringify(v));
      if (flat.length === 0) return 0;
      return await this.client.lpush(this.key(key), ...flat);
    } catch (err) {
      this.logger.error?.(`[RedisService] lpushJSON failed for key=${key}:`, err);
      throw err;
    }
  }

  async rpush(key, ...values) {
    try {
      const flat = values.flat().map((v) => (typeof v === 'string' ? v : String(v)));
      if (flat.length === 0) return 0;
      return await this.client.rpush(this.key(key), ...flat);
    } catch (err) {
      this.logger.error?.(`[RedisService] rpush failed for key=${key}:`, err);
      throw err;
    }
  }

  async rpushJSON(key, ...values) {
    try {
      const flat = values.flat().map((v) => JSON.stringify(v));
      if (flat.length === 0) return 0;
      return await this.client.rpush(this.key(key), ...flat);
    } catch (err) {
      this.logger.error?.(`[RedisService] rpushJSON failed for key=${key}:`, err);
      throw err;
    }
  }

  async lpop(key, count = null) {
    try {
      if (count !== null) return await this.client.lpop(this.key(key), count);
      return await this.client.lpop(this.key(key));
    } catch (err) {
      this.logger.error?.(`[RedisService] lpop failed for key=${key}:`, err);
      throw err;
    }
  }

  async lpopJSON(key) {
    try {
      const val = await this.lpop(key);
      return val ? JSON.parse(val) : null;
    } catch (err) {
      this.logger.error?.(`[RedisService] lpopJSON failed for key=${key}:`, err);
      throw err;
    }
  }

  async rpop(key, count = null) {
    try {
      if (count !== null) return await this.client.rpop(this.key(key), count);
      return await this.client.rpop(this.key(key));
    } catch (err) {
      this.logger.error?.(`[RedisService] rpop failed for key=${key}:`, err);
      throw err;
    }
  }

  async rpopJSON(key) {
    try {
      const val = await this.rpop(key);
      return val ? JSON.parse(val) : null;
    } catch (err) {
      this.logger.error?.(`[RedisService] rpopJSON failed for key=${key}:`, err);
      throw err;
    }
  }

  async lrange(key, start = 0, stop = -1) {
    try {
      return await this.client.lrange(this.key(key), start, stop);
    } catch (err) {
      this.logger.error?.(`[RedisService] lrange failed for key=${key}:`, err);
      throw err;
    }
  }

  async lrangeJSON(key, start = 0, stop = -1) {
    try {
      const items = await this.lrange(key, start, stop);
      return items.map((i) => {
        try {
          return JSON.parse(i);
        } catch {
          return i;
        }
      });
    } catch (err) {
      this.logger.error?.(`[RedisService] lrangeJSON failed for key=${key}:`, err);
      throw err;
    }
  }

  async llen(key) {
    try {
      return await this.client.llen(this.key(key));
    } catch (err) {
      this.logger.error?.(`[RedisService] llen failed for key=${key}:`, err);
      throw err;
    }
  }

  async lindex(key, index) {
    try {
      return await this.client.lindex(this.key(key), index);
    } catch (err) {
      this.logger.error?.(`[RedisService] lindex failed for key=${key}:`, err);
      throw err;
    }
  }

  async lindexJSON(key, index) {
    try {
      const val = await this.lindex(key, index);
      return val ? JSON.parse(val) : null;
    } catch (err) {
      this.logger.error?.(`[RedisService] lindexJSON failed for key=${key}:`, err);
      throw err;
    }
  }

  async ltrim(key, start, stop) {
    try {
      return await this.client.ltrim(this.key(key), start, stop);
    } catch (err) {
      this.logger.error?.(`[RedisService] ltrim failed for key=${key}:`, err);
      throw err;
    }
  }

  async lrem(key, count, value) {
    try {
      return await this.client.lrem(this.key(key), count, value);
    } catch (err) {
      this.logger.error?.(`[RedisService] lrem failed for key=${key}:`, err);
      throw err;
    }
  }

  async rpoplpush(sourceKey, destKey) {
    try {
      return await this.client.rpoplpush(this.key(sourceKey), this.key(destKey));
    } catch (err) {
      this.logger.error?.(`[RedisService] rpoplpush failed: ${err.message}`);
      throw err;
    }
  }

  async blpop(key, timeoutSeconds = 0) {
    try {
      return await this.client.blpop(this.key(key), timeoutSeconds);
    } catch (err) {
      this.logger.error?.(`[RedisService] blpop failed for key=${key}:`, err);
      throw err;
    }
  }

  async brpop(key, timeoutSeconds = 0) {
    try {
      return await this.client.brpop(this.key(key), timeoutSeconds);
    } catch (err) {
      this.logger.error?.(`[RedisService] brpop failed for key=${key}:`, err);
      throw err;
    }
  }

  async sadd(key, ...members) {
    try {
      const flat = members.flat().map((m) => (typeof m === 'string' ? m : String(m)));
      if (flat.length === 0) return 0;
      return await this.client.sadd(this.key(key), ...flat);
    } catch (err) {
      this.logger.error?.(`[RedisService] sadd failed for key=${key}:`, err);
      throw err;
    }
  }

  async saddJSON(key, ...members) {
    try {
      const flat = members.flat().map((m) => JSON.stringify(m));
      if (flat.length === 0) return 0;
      return await this.client.sadd(this.key(key), ...flat);
    } catch (err) {
      this.logger.error?.(`[RedisService] saddJSON failed for key=${key}:`, err);
      throw err;
    }
  }

  async srem(key, ...members) {
    try {
      const flat = members.flat().map((m) => (typeof m === 'string' ? m : String(m)));
      if (flat.length === 0) return 0;
      return await this.client.srem(this.key(key), ...flat);
    } catch (err) {
      this.logger.error?.(`[RedisService] srem failed for key=${key}:`, err);
      throw err;
    }
  }

  async sremJSON(key, ...members) {
    try {
      const flat = members.flat().map((m) => JSON.stringify(m));
      if (flat.length === 0) return 0;
      return await this.client.srem(this.key(key), ...flat);
    } catch (err) {
      this.logger.error?.(`[RedisService] sremJSON failed for key=${key}:`, err);
      throw err;
    }
  }

  async smembers(key) {
    try {
      return await this.client.smembers(this.key(key));
    } catch (err) {
      this.logger.error?.(`[RedisService] smembers failed for key=${key}:`, err);
      throw err;
    }
  }

  async smembersJSON(key) {
    try {
      const members = await this.smembers(key);
      return members.map((m) => {
        try {
          return JSON.parse(m);
        } catch {
          return m;
        }
      });
    } catch (err) {
      this.logger.error?.(`[RedisService] smembersJSON failed for key=${key}:`, err);
      throw err;
    }
  }

  async sismember(key, member) {
    try {
      const m = typeof member === 'string' ? member : String(member);
      const result = await this.client.sismember(this.key(key), m);
      return result === 1;
    } catch (err) {
      this.logger.error?.(`[RedisService] sismember failed for key=${key}:`, err);
      throw err;
    }
  }

  async scard(key) {
    try {
      return await this.client.scard(this.key(key));
    } catch (err) {
      this.logger.error?.(`[RedisService] scard failed for key=${key}:`, err);
      throw err;
    }
  }

  async spop(key, count = null) {
    try {
      if (count !== null) return await this.client.spop(this.key(key), count);
      return await this.client.spop(this.key(key));
    } catch (err) {
      this.logger.error?.(`[RedisService] spop failed for key=${key}:`, err);
      throw err;
    }
  }

  async srandmember(key, count = null) {
    try {
      if (count !== null) return await this.client.srandmember(this.key(key), count);
      return await this.client.srandmember(this.key(key));
    } catch (err) {
      this.logger.error?.(`[RedisService] srandmember failed for key=${key}:`, err);
      throw err;
    }
  }

  async sunion(...keys) {
    try {
      const flatKeys = keys.flat().map((k) => this.key(k));
      return await this.client.sunion(...flatKeys);
    } catch (err) {
      this.logger.error?.('[RedisService] sunion failed:', err);
      throw err;
    }
  }

  async sinter(...keys) {
    try {
      const flatKeys = keys.flat().map((k) => this.key(k));
      return await this.client.sinter(...flatKeys);
    } catch (err) {
      this.logger.error?.('[RedisService] sinter failed:', err);
      throw err;
    }
  }

  async sdiff(...keys) {
    try {
      const flatKeys = keys.flat().map((k) => this.key(k));
      return await this.client.sdiff(...flatKeys);
    } catch (err) {
      this.logger.error?.('[RedisService] sdiff failed:', err);
      throw err;
    }
  }

  async zadd(key, score, member) {
    try {
      return await this.client.zadd(this.key(key), score, member);
    } catch (err) {
      this.logger.error?.(`[RedisService] zadd failed for key=${key}:`, err);
      throw err;
    }
  }

  async zaddMultiple(key, items) {
    try {
      const args = [];
      if (Array.isArray(items)) {
        for (const item of items) {
          if (typeof item === 'object' && item.score !== undefined && item.member !== undefined) {
            args.push(item.score, item.member);
          } else {
            args.push(item);
          }
        }
      }
      if (args.length === 0) return 0;
      return await this.client.zadd(this.key(key), ...args);
    } catch (err) {
      this.logger.error?.(`[RedisService] zaddMultiple failed for key=${key}:`, err);
      throw err;
    }
  }

  async zrange(key, start = 0, stop = -1, withScores = false) {
    try {
      if (withScores) {
        return await this.client.zrange(this.key(key), start, stop, 'WITHSCORES');
      }
      return await this.client.zrange(this.key(key), start, stop);
    } catch (err) {
      this.logger.error?.(`[RedisService] zrange failed for key=${key}:`, err);
      throw err;
    }
  }

  async zrevrange(key, start = 0, stop = -1, withScores = false) {
    try {
      if (withScores) {
        return await this.client.zrevrange(this.key(key), start, stop, 'WITHSCORES');
      }
      return await this.client.zrevrange(this.key(key), start, stop);
    } catch (err) {
      this.logger.error?.(`[RedisService] zrevrange failed for key=${key}:`, err);
      throw err;
    }
  }

  async zrangebyscore(
    key,
    min = '-inf',
    max = '+inf',
    withScores = false,
    offset = null,
    count = null
  ) {
    try {
      const args = [this.key(key), min, max];
      if (withScores) args.push('WITHSCORES');
      if (offset !== null && count !== null) {
        args.push('LIMIT', offset, count);
      }
      return await this.client.zrangebyscore(...args);
    } catch (err) {
      this.logger.error?.(`[RedisService] zrangebyscore failed for key=${key}:`, err);
      throw err;
    }
  }

  async zrevrangebyscore(
    key,
    max = '+inf',
    min = '-inf',
    withScores = false,
    offset = null,
    count = null
  ) {
    try {
      const args = [this.key(key), max, min];
      if (withScores) args.push('WITHSCORES');
      if (offset !== null && count !== null) {
        args.push('LIMIT', offset, count);
      }
      return await this.client.zrevrangebyscore(...args);
    } catch (err) {
      this.logger.error?.(`[RedisService] zrevrangebyscore failed for key=${key}:`, err);
      throw err;
    }
  }

  async zrem(key, ...members) {
    try {
      const flat = members.flat();
      if (flat.length === 0) return 0;
      return await this.client.zrem(this.key(key), ...flat);
    } catch (err) {
      this.logger.error?.(`[RedisService] zrem failed for key=${key}:`, err);
      throw err;
    }
  }

  async zremrangebyscore(key, min, max) {
    try {
      return await this.client.zremrangebyscore(this.key(key), min, max);
    } catch (err) {
      this.logger.error?.(`[RedisService] zremrangebyscore failed for key=${key}:`, err);
      throw err;
    }
  }

  async zremrangebyrank(key, start, stop) {
    try {
      return await this.client.zremrangebyrank(this.key(key), start, stop);
    } catch (err) {
      this.logger.error?.(`[RedisService] zremrangebyrank failed for key=${key}:`, err);
      throw err;
    }
  }

  async zscore(key, member) {
    try {
      return await this.client.zscore(this.key(key), member);
    } catch (err) {
      this.logger.error?.(`[RedisService] zscore failed for key=${key}:`, err);
      throw err;
    }
  }

  async zrank(key, member) {
    try {
      return await this.client.zrank(this.key(key), member);
    } catch (err) {
      this.logger.error?.(`[RedisService] zrank failed for key=${key}:`, err);
      throw err;
    }
  }

  async zrevrank(key, member) {
    try {
      return await this.client.zrevrank(this.key(key), member);
    } catch (err) {
      this.logger.error?.(`[RedisService] zrevrank failed for key=${key}:`, err);
      throw err;
    }
  }

  async zcard(key) {
    try {
      return await this.client.zcard(this.key(key));
    } catch (err) {
      this.logger.error?.(`[RedisService] zcard failed for key=${key}:`, err);
      throw err;
    }
  }

  async zcount(key, min, max) {
    try {
      return await this.client.zcount(this.key(key), min, max);
    } catch (err) {
      this.logger.error?.(`[RedisService] zcount failed for key=${key}:`, err);
      throw err;
    }
  }

  async zincrby(key, increment, member) {
    try {
      return await this.client.zincrby(this.key(key), increment, member);
    } catch (err) {
      this.logger.error?.(`[RedisService] zincrby failed for key=${key}:`, err);
      throw err;
    }
  }

  async zpopmin(key, count = 1) {
    try {
      return await this.client.zpopmin(this.key(key), count);
    } catch (err) {
      this.logger.error?.(`[RedisService] zpopmin failed for key=${key}:`, err);
      throw err;
    }
  }

  async zpopmax(key, count = 1) {
    try {
      return await this.client.zpopmax(this.key(key), count);
    } catch (err) {
      this.logger.error?.(`[RedisService] zpopmax failed for key=${key}:`, err);
      throw err;
    }
  }

  async geoadd(key, longitude, latitude, member) {
    try {
      return await this.client.geoadd(this.key(key), longitude, latitude, member);
    } catch (err) {
      this.logger.error?.(`[RedisService] geoadd failed for key=${key}:`, err);
      throw err;
    }
  }

  async geodist(key, member1, member2, unit = 'm') {
    try {
      return await this.client.geodist(this.key(key), member1, member2, unit);
    } catch (err) {
      this.logger.error?.(`[RedisService] geodist failed for key=${key}:`, err);
      throw err;
    }
  }

  async geopos(key, ...members) {
    try {
      const flat = members.flat();
      return await this.client.geopos(this.key(key), ...flat);
    } catch (err) {
      this.logger.error?.(`[RedisService] geopos failed for key=${key}:`, err);
      throw err;
    }
  }

  async geosearch(key, longitude, latitude, radius, unit = 'km', count = null, sort = 'ASC') {
    try {
      const args = [
        this.key(key),
        'FROMLONLAT',
        longitude,
        latitude,
        'BYRADIUS',
        radius,
        unit,
        sort,
        'WITHDIST',
        'WITHCOORD',
      ];
      if (count) args.push('COUNT', count);
      return await this.client.geosearch(...args);
    } catch (err) {
      this.logger.error?.(`[RedisService] geosearch failed for key=${key}:`, err);
      throw err;
    }
  }

  async pfadd(key, ...elements) {
    try {
      const flat = elements.flat();
      if (flat.length === 0) return 0;
      return await this.client.pfadd(this.key(key), ...flat);
    } catch (err) {
      this.logger.error?.(`[RedisService] pfadd failed for key=${key}:`, err);
      throw err;
    }
  }

  async pfcount(...keys) {
    try {
      const flatKeys = keys.flat().map((k) => this.key(k));
      if (flatKeys.length === 0) return 0;
      return await this.client.pfcount(...flatKeys);
    } catch (err) {
      this.logger.error?.('[RedisService] pfcount failed:', err);
      throw err;
    }
  }

  async pfmerge(destKey, ...sourceKeys) {
    try {
      const flatSources = sourceKeys.flat().map((k) => this.key(k));
      return await this.client.pfmerge(this.key(destKey), ...flatSources);
    } catch (err) {
      this.logger.error?.('[RedisService] pfmerge failed:', err);
      throw err;
    }
  }

  async setbit(key, offset, value) {
    try {
      return await this.client.setbit(this.key(key), offset, value);
    } catch (err) {
      this.logger.error?.(`[RedisService] setbit failed for key=${key}:`, err);
      throw err;
    }
  }

  async getbit(key, offset) {
    try {
      return await this.client.getbit(this.key(key), offset);
    } catch (err) {
      this.logger.error?.(`[RedisService] getbit failed for key=${key}:`, err);
      throw err;
    }
  }

  async bitcount(key, start = null, end = null) {
    try {
      if (start !== null && end !== null) {
        return await this.client.bitcount(this.key(key), start, end);
      }
      return await this.client.bitcount(this.key(key));
    } catch (err) {
      this.logger.error?.(`[RedisService] bitcount failed for key=${key}:`, err);
      throw err;
    }
  }

  /**
   * Acquire an atomic distributed lock
   * @param {string} resourceKey
   * @param {number} [ttlMs=5000]
   * @param {object} [options]
   * @returns {Promise<{ key: string, lockId: string, release: Function }>}
   */
  async acquireLock(resourceKey, ttlMs = 5000, { retryCount = 10, retryDelayMs = 150 } = {}) {
    const lockKey = this.key(`lock:${resourceKey}`);
    const lockId = crypto.randomBytes(16).toString('hex');
    let attempts = 0;

    while (attempts < retryCount) {
      const acquired = await this.client.set(lockKey, lockId, 'PX', ttlMs, 'NX');
      if (acquired === 'OK') {
        return {
          key: lockKey,
          lockId,
          release: async () => {
            return this.releaseLock({ key: lockKey, lockId });
          },
        };
      }
      attempts++;
      const jitter = Math.floor(Math.random() * 50);
      await new Promise((r) => setTimeout(r, retryDelayMs + jitter));
    }

    throw new Error(`[RedisService] Failed to acquire lock for resource: ${resourceKey}`);
  }

  /**
   * Release an atomic distributed lock using Lua script
   */
  async releaseLock(lockObj) {
    if (!lockObj || !lockObj.key || !lockObj.lockId) return false;
    try {
      const luaScript = `
                if redis.call("get", KEYS[1]) == ARGV[1] then
                    return redis.call("del", KEYS[1])
                else
                    return 0
                end
            `;
      const result = await this.client.eval(luaScript, 1, lockObj.key, lockObj.lockId);
      return result === 1;
    } catch (err) {
      this.logger.warn?.('[RedisService] Lock release error:', err.message);
      return false;
    }
  }

  async withLock(resourceKey, ttlMs, handlerFn, options = {}) {
    const _ttlMs = ttlMs || 5000;
    if (this.redlock && typeof this.redlock.acquire === 'function') {
      const lockKey = this.key(`lock:${resourceKey}`);
      const lock = await this.redlock.acquire([lockKey], _ttlMs);
      try {
        return await handlerFn();
      } finally {
        try {
          await lock.release();
        } catch (err) {
          this.logger.warn?.('[RedisService] Redlock release failed:', err.message);
        }
      }
    }

    const lock = await this.acquireLock(resourceKey, ttlMs, options);
    try {
      return await handlerFn();
    } finally {
      await lock.release().catch(() => {});
    }
  }

  async withSemaphore(resourceKey, maxConcurrent, ttlMs, handlerFn) {
    const _ttlMs = ttlMs || 10000;
    const semKey = this.key(`semaphore:${resourceKey}`);
    const semId = crypto.randomBytes(16).toString('hex');
    const now = Date.now();
    const expiresAt = now + _ttlMs;

    const acquireScript = `
            redis.call('zremrangebyscore', KEYS[1], '-inf', ARGV[1])
            local current = redis.call('zcard', KEYS[1])
            if current < tonumber(ARGV[2]) then
                redis.call('zadd', KEYS[1], ARGV[3], ARGV[4])
                return 1
            else
                return 0
            end
        `;

    const acquired = await this.client.eval(
      acquireScript,
      1,
      semKey,
      now,
      maxConcurrent,
      expiresAt,
      semId
    );

    if (acquired !== 1) {
      throw new Error(
        `[RedisService] Concurrency limit (${maxConcurrent}) reached for ${resourceKey}`
      );
    }

    try {
      return await handlerFn();
    } finally {
      await this.client.zrem(semKey, semId).catch(() => {});
    }
  }

  /**
   * Fixed Window Counter Rate Limiter
   */
  async rateLimit(key, limit, windowSeconds) {
    try {
      const redisKey = this.key(`ratelimit:fixed:${key}`);
      const pipeline = this.client.pipeline();

      pipeline.incr(redisKey);
      pipeline.ttl(redisKey);

      const [[, count], [, ttl]] = await pipeline.exec();

      if (count === 1) {
        await this.client.expire(redisKey, windowSeconds);
      }

      const remaining = Math.max(limit - count, 0);
      const allowed = count <= limit;
      const resetInSeconds = ttl > 0 ? ttl : windowSeconds;

      return { allowed, remaining, resetInSeconds, count };
    } catch (err) {
      this.logger.error?.(`[RedisService] rateLimit failed for key=${key}:`, err);
      throw err;
    }
  }

  /**
   * Sliding Window Log Rate Limiter (Exact millisecond sliding window)
   */
  async slidingWindowRateLimit(key, limit, windowSeconds) {
    try {
      const redisKey = this.key(`ratelimit:sliding:${key}`);
      const now = Date.now();
      const windowMs = windowSeconds * 1000;
      const clearBefore = now - windowMs;
      const requestId = `${now}:${crypto.randomBytes(4).toString('hex')}`;

      const luaScript = `
                redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, ARGV[1])
                local currentRequests = redis.call('ZCARD', KEYS[1])
                if currentRequests < tonumber(ARGV[2]) then
                    redis.call('ZADD', KEYS[1], ARGV[3], ARGV[4])
                    redis.call('PEXPIRE', KEYS[1], ARGV[5])
                    return {1, tonumber(ARGV[2]) - currentRequests - 1}
                else
                    return {0, 0}
                end
            `;

      const [allowedNum, remaining] = await this.client.eval(
        luaScript,
        1,
        redisKey,
        clearBefore,
        limit,
        now,
        requestId,
        windowMs
      );

      return {
        allowed: allowedNum === 1,
        remaining: Math.max(0, remaining),
        resetInSeconds: windowSeconds,
      };
    } catch (err) {
      this.logger.error?.(`[RedisService] slidingWindowRateLimit failed for key=${key}:`, err);
      throw err;
    }
  }

  /**
   * Token Bucket Rate Limiter
   */
  async tokenBucket(key, capacity, refillRatePerSec, cost = 1) {
    try {
      const bucketKey = this.key(`ratelimit:bucket:${key}`);
      const now = Date.now() / 1000;

      const luaScript = `
                local key = KEYS[1]
                local capacity = tonumber(ARGV[1])
                local refillRate = tonumber(ARGV[2])
                local cost = tonumber(ARGV[3])
                local now = tonumber(ARGV[4])

                local data = redis.call('HMGET', key, 'tokens', 'lastRefill')
                local tokens = tonumber(data[1])
                local lastRefill = tonumber(data[2])

                if tokens == nil then
                    tokens = capacity
                    lastRefill = now
                else
                    local delta = math.max(0, now - lastRefill)
                    tokens = math.min(capacity, tokens + (delta * refillRate))
                    lastRefill = now
                end

                if tokens >= cost then
                    tokens = tokens - cost
                    redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', lastRefill)
                    redis.call('EXPIRE', key, math.ceil(capacity / refillRate) * 2)
                    return {1, math.floor(tokens)}
                else
                    redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', lastRefill)
                    return {0, math.floor(tokens)}
                end
            `;

      const [allowedNum, remainingTokens] = await this.client.eval(
        luaScript,
        1,
        bucketKey,
        capacity,
        refillRatePerSec,
        cost,
        now
      );

      return {
        allowed: allowedNum === 1,
        remaining: remainingTokens,
        resetInSeconds: Math.ceil((capacity - remainingTokens) / refillRatePerSec),
      };
    } catch (err) {
      this.logger.error?.(`[RedisService] tokenBucket failed for key=${key}:`, err);
      throw err;
    }
  }

  async publish(channel, message) {
    try {
      const channelKey = this.key(`channel:${channel}`);
      const payload = typeof message === 'string' ? message : JSON.stringify(message);
      return await this.publisher.publish(channelKey, payload);
    } catch (err) {
      this.logger.error?.(`[RedisService] publish failed for channel=${channel}:`, err);
      throw err;
    }
  }

  async subscribe(channel, handlerFn) {
    try {
      const channelKey = this.key(`channel:${channel}`);
      const rawChan = String(channel).trim();

      if (!this._subCallbacks.has(rawChan)) {
        this._subCallbacks.set(rawChan, new Set());
        await this.subscriber.subscribe(channelKey);
        this.logger.info?.(`[RedisService] Subscribed to ${channelKey}`);
      }

      this._subCallbacks.get(rawChan).add(handlerFn);

      return () => this.unsubscribe(channel, handlerFn);
    } catch (err) {
      this.logger.error?.(`[RedisService] subscribe failed for channel=${channel}:`, err);
      throw err;
    }
  }

  async unsubscribe(channel, handlerFn = null) {
    try {
      const channelKey = this.key(`channel:${channel}`);
      const rawChan = String(channel).trim();

      if (handlerFn && this._subCallbacks.has(rawChan)) {
        this._subCallbacks.get(rawChan).delete(handlerFn);
        if (this._subCallbacks.get(rawChan).size > 0) return;
      }

      this._subCallbacks.delete(rawChan);
      await this.subscriber.unsubscribe(channelKey);
      this.logger.info?.(`[RedisService] Unsubscribed from ${channelKey}`);
    } catch (err) {
      this.logger.error?.(`[RedisService] unsubscribe failed for channel=${channel}:`, err);
      throw err;
    }
  }

  async psubscribe(pattern, handlerFn) {
    try {
      const patternKey = this.key(`channel:${pattern}`);
      const rawPattern = String(pattern).trim();

      if (!this._psubCallbacks.has(rawPattern)) {
        this._psubCallbacks.set(rawPattern, new Set());
        await this.subscriber.psubscribe(patternKey);
        this.logger.info?.(`[RedisService] PSubscribed to ${patternKey}`);
      }

      this._psubCallbacks.get(rawPattern).add(handlerFn);

      return () => this.punsubscribe(pattern, handlerFn);
    } catch (err) {
      this.logger.error?.(`[RedisService] psubscribe failed for pattern=${pattern}:`, err);
      throw err;
    }
  }

  async punsubscribe(pattern, handlerFn = null) {
    try {
      const patternKey = this.key(`channel:${pattern}`);
      const rawPattern = String(pattern).trim();

      if (handlerFn && this._psubCallbacks.has(rawPattern)) {
        this._psubCallbacks.get(rawPattern).delete(handlerFn);
        if (this._psubCallbacks.get(rawPattern).size > 0) return;
      }

      this._psubCallbacks.delete(rawPattern);
      await this.subscriber.punsubscribe(patternKey);
      this.logger.info?.(`[RedisService] PUnsubscribed from ${patternKey}`);
    } catch (err) {
      this.logger.error?.(`[RedisService] punsubscribe failed for pattern=${pattern}:`, err);
      throw err;
    }
  }

  async xadd(streamKey, id = '*', payload = {}, maxLen = null) {
    try {
      const redisKey = this.key(`stream:${streamKey}`);
      const flat = [];
      for (const [k, v] of Object.entries(payload)) {
        flat.push(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
      }
      if (flat.length === 0) flat.push('data', '');

      if (maxLen) {
        return await this.client.xadd(redisKey, 'MAXLEN', '~', maxLen, id, ...flat);
      }
      return await this.client.xadd(redisKey, id, ...flat);
    } catch (err) {
      this.logger.error?.(`[RedisService] xadd failed for stream=${streamKey}:`, err);
      throw err;
    }
  }

  async xread(streamKey, lastId = '$', count = null, blockMs = null) {
    try {
      const redisKey = this.key(`stream:${streamKey}`);
      const args = [];
      if (count) args.push('COUNT', count);
      if (blockMs !== null) args.push('BLOCK', blockMs);
      args.push('STREAMS', redisKey, lastId);
      return await this.client.xread(...args);
    } catch (err) {
      this.logger.error?.(`[RedisService] xread failed for stream=${streamKey}:`, err);
      throw err;
    }
  }

  async xgroupCreate(streamKey, groupName, id = '$', makeStream = true) {
    try {
      const redisKey = this.key(`stream:${streamKey}`);
      const args = ['CREATE', redisKey, groupName, id];
      if (makeStream) args.push('MKSTREAM');
      return await this.client.xgroup(...args);
    } catch (err) {
      if (err.message?.includes('BUSYGROUP')) {
        return 'OK';
      }
      this.logger.error?.(`[RedisService] xgroupCreate failed for stream=${streamKey}:`, err);
      throw err;
    }
  }

  async xreadgroup(groupName, consumerName, streamKey, lastId = '>', count = 10, blockMs = null) {
    try {
      const redisKey = this.key(`stream:${streamKey}`);
      const args = ['GROUP', groupName, consumerName];
      if (count) args.push('COUNT', count);
      if (blockMs !== null) args.push('BLOCK', blockMs);
      args.push('STREAMS', redisKey, lastId);
      return await this.client.xreadgroup(...args);
    } catch (err) {
      this.logger.error?.(`[RedisService] xreadgroup failed for stream=${streamKey}:`, err);
      throw err;
    }
  }

  async xack(streamKey, groupName, ...ids) {
    try {
      const flatIds = ids.flat();
      if (flatIds.length === 0) return 0;
      return await this.client.xack(this.key(`stream:${streamKey}`), groupName, ...flatIds);
    } catch (err) {
      this.logger.error?.(`[RedisService] xack failed for stream=${streamKey}:`, err);
      throw err;
    }
  }

  async xlen(streamKey) {
    try {
      return await this.client.xlen(this.key(`stream:${streamKey}`));
    } catch (err) {
      this.logger.error?.(`[RedisService] xlen failed for stream=${streamKey}:`, err);
      throw err;
    }
  }

  async xtrim(streamKey, maxLen, approximate = true) {
    try {
      const redisKey = this.key(`stream:${streamKey}`);
      if (approximate) {
        return await this.client.xtrim(redisKey, 'MAXLEN', '~', maxLen);
      }
      return await this.client.xtrim(redisKey, 'MAXLEN', maxLen);
    } catch (err) {
      this.logger.error?.(`[RedisService] xtrim failed for stream=${streamKey}:`, err);
      throw err;
    }
  }

  async xpending(streamKey, groupName) {
    try {
      return await this.client.xpending(this.key(`stream:${streamKey}`), groupName);
    } catch (err) {
      this.logger.error?.(`[RedisService] xpending failed for stream=${streamKey}:`, err);
      throw err;
    }
  }

  async xclaim(streamKey, groupName, consumerName, minIdleTimeMs, ...ids) {
    try {
      const flatIds = ids.flat();
      if (flatIds.length === 0) return [];
      return await this.client.xclaim(
        this.key(`stream:${streamKey}`),
        groupName,
        consumerName,
        minIdleTimeMs,
        ...flatIds
      );
    } catch (err) {
      this.logger.error?.(`[RedisService] xclaim failed for stream=${streamKey}:`, err);
      throw err;
    }
  }

  pipeline() {
    return this.client.pipeline();
  }

  multi() {
    return this.client.multi();
  }

  async transaction(pipelineFn) {
    try {
      const pipeline = this.client.multi();
      await pipelineFn(pipeline);
      return await pipeline.exec();
    } catch (err) {
      this.logger.error?.('[RedisService] transaction failed:', err);
      throw err;
    }
  }

  async eval(script, keys = [], args = []) {
    try {
      const redisKeys = keys.map((k) => this.key(k));
      return await this.client.eval(script, redisKeys.length, ...redisKeys, ...args);
    } catch (err) {
      this.logger.error?.('[RedisService] eval failed:', err);
      throw err;
    }
  }

  async evalsha(sha, keys = [], args = []) {
    try {
      const redisKeys = keys.map((k) => this.key(k));
      return await this.client.evalsha(sha, redisKeys.length, ...redisKeys, ...args);
    } catch (err) {
      this.logger.error?.('[RedisService] evalsha failed:', err);
      throw err;
    }
  }
}

export default RedisService;
