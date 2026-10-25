import cache from '../config/redis.js';

export const cacheMiddleware = (keyGenerator, ttlSeconds = 300) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Determine cache key
    let cacheKey;
    if (typeof keyGenerator === 'function') {
      cacheKey = keyGenerator(req);
    } else if (typeof keyGenerator === 'string') {
      cacheKey = keyGenerator;
    } else {
      cacheKey = `fleet:route:${req.originalUrl || req.url}`;
    }

    try {
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        const parsed = JSON.parse(cachedData);
        return res.status(200).json(parsed);
      }

      // If MISS, hijack res.json to save into cache before sending
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-Key', cacheKey);

      const originalJson = res.json.bind(res);
      res.json = (body) => {
        // Only cache successful 200 responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(cacheKey, body, 'EX', ttlSeconds).catch((err) => {
            console.error('[Cache] Error writing to cache:', err.message);
          });
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      console.error('[Cache] Middleware exception:', err.message);
      next();
    }
  };
};

export const invalidateCache = async (...prefixes) => {
  try {
    for (const prefix of prefixes) {
      await cache.delByPrefix(prefix);
      await cache.del(prefix);
    }
  } catch (err) {
    console.error('[Cache] Invalidation error:', err.message);
  }
};
