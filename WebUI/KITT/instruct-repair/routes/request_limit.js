const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 120;
const requests = new Map();

module.exports = function requestLimit(req, res, next) {
  const now = Date.now();
  const key = req.socket.remoteAddress || 'local';
  let entry = requests.get(key);

  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    requests.set(key, entry);
  }
  if (entry.count >= MAX_REQUESTS) {
    return res.status(429).json({ error: 'Too many local requests; try again shortly.' });
  }

  entry.count += 1;
  if (requests.size > 256) {
    for (const [address, bucket] of requests) {
      if (bucket.resetAt <= now) requests.delete(address);
    }
  }
  next();
};
