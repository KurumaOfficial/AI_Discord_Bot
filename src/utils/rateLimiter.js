// Authors: Kuruma, Letifer

export class RateLimiter {
  constructor({ windowMs = 15_000, maxRequests = 6 } = {}) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.records = new Map();
  }

  consume(key) {
    const now = Date.now();
    const history = this.records.get(key) || [];
    const filtered = history.filter((timestamp) => now - timestamp < this.windowMs);

    if (filtered.length >= this.maxRequests) {
      this.records.set(key, filtered);
      return {
        allowed: false,
        retryAfterMs: this.windowMs - (now - filtered[0])
      };
    }

    filtered.push(now);
    this.records.set(key, filtered);
    return { allowed: true, retryAfterMs: 0 };
  }
}
