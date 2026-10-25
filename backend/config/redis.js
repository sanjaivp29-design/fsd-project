import Redis from 'ioredis';

class InMemoryCache {
  constructor() {
    this.store = new Map();
    this.hits = 0;
    this.misses = 0;
    this.isRealRedis = false;
  }

  async get(key) {
    const item = this.store.get(key);
    if (!item) {
      this.misses++;
      return null;
    }
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }
    this.hits++;
    return item.value;
  }

  async set(key, value, mode, duration) {
    let expiresAt = null;
    if (mode === 'EX' && duration) {
      expiresAt = Date.now() + duration * 1000;
    }
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(...keys) {
    let count = 0;
    for (const key of keys.flat()) {
      if (this.store.delete(key)) count++;
    }
    return count;
  }

  async delByPrefix(prefix) {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  async flushall() {
    this.store.clear();
    return 'OK';
  }

  async keys(pattern = '*') {
    const now = Date.now();
    const result = [];
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const [key, item] of this.store.entries()) {
      if (item.expiresAt && now > item.expiresAt) {
        this.store.delete(key);
      } else if (regex.test(key)) {
        result.push(key);
      }
    }
    return result;
  }

  getStats() {
    return {
      type: 'in-memory-fallback',
      activeKeys: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0 ? ((this.hits / (this.hits + this.misses)) * 100).toFixed(1) + '%' : '0%',
    };
  }
}

class CacheService {
  constructor() {
    this.client = null;
    this.inMemory = new InMemoryCache();
    this.isRealRedis = false;
    this.hits = 0;
    this.misses = 0;
    this.init();
  }

  init() {
    const host = process.env.REDIS_HOST || '127.0.0.1';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    const password = process.env.REDIS_PASSWORD || undefined;

    console.log(`[Redis] Attempting connection to Redis at ${host}:${port}...`);

    try {
      this.client = new Redis({
        host,
        port,
        password,
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        enableOfflineQueue: false,
        retryStrategy: (times) => {
          if (times > 2) return null; // Stop retrying quickly to avoid log spam
          return Math.min(times * 100, 1000);
        },
      });

      this.client.on('connect', () => {
        this.isRealRedis = true;
        console.log(`[Redis] Connected successfully to external Redis cache server at ${host}:${port}!`);
      });

      this.client.on('error', (err) => {
        if (!this.isRealRedis) {
          // Normal during development without redis service
          // Silently route through in-memory fallback
        } else {
          console.warn(`[Redis] Connection warning: ${err.message}`);
        }
      });
    } catch (err) {
      console.warn(`[Redis] Initialization warning: ${err.message}`);
    }
  }

  async get(key) {
    if (this.isRealRedis && this.client && this.client.status === 'ready') {
      try {
        const val = await this.client.get(key);
        if (val) this.hits++;
        else this.misses++;
        return val;
      } catch (e) {
        return this.inMemory.get(key);
      }
    }
    return this.inMemory.get(key);
  }

  async set(key, value, mode = 'EX', duration = 300) {
    const strVal = typeof value === 'string' ? value : JSON.stringify(value);
    if (this.isRealRedis && this.client && this.client.status === 'ready') {
      try {
        return await this.client.set(key, strVal, mode, duration);
      } catch (e) {
        return this.inMemory.set(key, strVal, mode, duration);
      }
    }
    return this.inMemory.set(key, strVal, mode, duration);
  }

  async del(...keys) {
    const flat = keys.flat();
    if (flat.length === 0) return 0;
    if (this.isRealRedis && this.client && this.client.status === 'ready') {
      try {
        await this.client.del(...flat);
      } catch (e) {
        // fallback
      }
    }
    return this.inMemory.del(...flat);
  }

  async delByPrefix(prefix) {
    if (this.isRealRedis && this.client && this.client.status === 'ready') {
      try {
        const keys = await this.client.keys(`${prefix}*`);
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } catch (e) {
        // fallback
      }
    }
    return this.inMemory.delByPrefix(prefix);
  }

  async flushall() {
    if (this.isRealRedis && this.client && this.client.status === 'ready') {
      try {
        await this.client.flushall();
      } catch (e) {
        // fallback
      }
    }
    return this.inMemory.flushall();
  }

  async getStats() {
    if (this.isRealRedis && this.client && this.client.status === 'ready') {
      try {
        const info = await this.client.info();
        const dbsize = await this.client.dbsize();
        return {
          type: 'standalone-redis-server',
          status: 'connected',
          activeKeys: dbsize,
          hits: this.hits,
          misses: this.misses,
          infoSnippet: info.slice(0, 150),
        };
      } catch (e) {
        // fallback
      }
    }
    return {
      ...this.inMemory.getStats(),
      status: 'active-memory-layer',
    };
  }
}

export const cache = new CacheService();
export default cache;
