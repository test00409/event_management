'use strict';
const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient;

const getRedisClient = () => {
  if (!redisClient) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB) || 0,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      enableOfflineQueue: false,
      lazyConnect: true,
    });

    redisClient.on('connect', () => logger.info('Redis connected'));
    redisClient.on('error', (err) => logger.warn('Redis error (non-fatal):', err.message));
    redisClient.on('close', () => logger.warn('Redis connection closed'));
  }
  return redisClient;
};

// In-memory fallback for environments without Redis
class InMemoryStore {
  constructor() {
    this.store = new Map();
    this.timers = new Map();
  }

  async set(key, value, exMode, exTime) {
    this.store.set(key, value);
    if (exMode === 'EX' && exTime) {
      clearTimeout(this.timers.get(key));
      this.timers.set(key, setTimeout(() => this.store.delete(key), exTime * 1000));
    }
    return 'OK';
  }

  async get(key) { return this.store.get(key) || null; }
  async del(key) { this.store.delete(key); return 1; }
  async incr(key) {
    const val = parseInt(this.store.get(key) || '0') + 1;
    this.store.set(key, String(val));
    return val;
  }
  async expire(key, seconds) {
    clearTimeout(this.timers.get(key));
    this.timers.set(key, setTimeout(() => this.store.delete(key), seconds * 1000));
    return 1;
  }
  async ttl(key) { return this.store.has(key) ? 300 : -2; }
}

let fallbackStore = new InMemoryStore();

const connectRedis = async () => {
  try {
    const client = getRedisClient();
    await client.connect();
    return client;
  } catch (error) {
    logger.warn('Redis unavailable, using in-memory fallback store');
    return null;
  }
};

// Redis service wrapper with fallback
const redisService = {
  async set(key, value, ...args) {
    try {
      const client = getRedisClient();
      return await client.set(key, value, ...args);
    } catch {
      return await fallbackStore.set(key, value, ...args);
    }
  },
  async get(key) {
    try {
      const client = getRedisClient();
      return await client.get(key);
    } catch {
      return await fallbackStore.get(key);
    }
  },
  async del(key) {
    try {
      const client = getRedisClient();
      return await client.del(key);
    } catch {
      return await fallbackStore.del(key);
    }
  },
  async incr(key) {
    try {
      const client = getRedisClient();
      return await client.incr(key);
    } catch {
      return await fallbackStore.incr(key);
    }
  },
  async expire(key, seconds) {
    try {
      const client = getRedisClient();
      return await client.expire(key, seconds);
    } catch {
      return await fallbackStore.expire(key, seconds);
    }
  },
  async ttl(key) {
    try {
      const client = getRedisClient();
      return await client.ttl(key);
    } catch {
      return await fallbackStore.ttl(key);
    }
  },
};

module.exports = { getRedisClient, connectRedis, redisService };
