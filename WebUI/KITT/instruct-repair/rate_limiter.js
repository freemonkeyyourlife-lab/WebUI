// Lightweight in-memory rate limiter middleware for local-first API routes
const requestBuckets = new Map();

function rateLimit(options = {}) {
  const windowMs = options.windowMs || 60 * 1000; // default 1 minute
  const maxRequests = options.max || 300; // default 300 requests per minute

  return function rateLimiter(req, res, next) {
    const key = req.ip || req.socket?.remoteAddress || '127.0.0.1';
    const now = Date.now();

    let bucket = requestBuckets.get(key);
    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 1, resetAt: now + windowMs };
      requestBuckets.set(key, bucket);
      return next();
    }

    bucket.count += 1;
    if (bucket.count > maxRequests) {
      res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please wait before retrying.'
      });
    }

    next();
  };
}

module.exports = { rateLimit };
