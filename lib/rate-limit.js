// lib/rate-limit.js
// Minimal in-memory fixed-window rate limiter.
//
// SCOPE: single-instance only. State lives in this Node process's memory, so it
// does NOT coordinate across multiple instances (serverless, PM2 cluster, etc).
// The exported surface (`rateLimit`) is deliberately tiny so a Redis/Upstash-
// backed store can replace the internals later without touching call sites.

const WINDOWS = new Map(); // key -> { count, resetAt }

let lastSweep = 0;

// Opportunistic cleanup so the Map can't grow unbounded from unique keys
// (e.g. one entry per attacker IP). Runs at most once per minute.
function sweep(now) {
  for (const [k, v] of WINDOWS) {
    if (v.resetAt <= now) WINDOWS.delete(k);
  }
}

// rateLimit("login:id:alice", { limit: 10, windowMs: 900000 })
//   → { ok, remaining, retryAfterMs }
// Every call counts as one hit against `key`'s current window.
export function rateLimit(key, { limit, windowMs }) {
  const now = Date.now();
  if (now - lastSweep > 60_000) { sweep(now); lastSweep = now; }

  let entry = WINDOWS.get(key);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowMs };
    WINDOWS.set(key, entry);
  }
  entry.count += 1;

  const ok = entry.count <= limit;
  return {
    ok,
    remaining:    Math.max(0, limit - entry.count),
    retryAfterMs: ok ? 0 : entry.resetAt - now,
  };
}

// Best-effort client IP from a Request's proxy headers. Returns "unknown" when
// nothing usable is present (e.g. the request object wasn't passed through).
export function clientIp(req) {
  const get = req?.headers?.get?.bind(req.headers);
  if (!get) return "unknown";
  const xff = get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return get("x-real-ip") || "unknown";
}
