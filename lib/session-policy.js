// lib/session-policy.js
// Shared, EDGE-SAFE session-timeout policy. Imported by BOTH the edge-safe
// auth.config.js (used by middleware) and the Node lib/auth.js, so the idle
// rules stay in one place. Keep this file free of Node-only imports (no Prisma,
// no bcrypt) — the middleware bundle pulls it in.
//
// Auto-logout on INACTIVITY (no requests to the site):
//   • Customers            → 6 hours
//   • Admins & moderators  → 12 hours
//
// Mechanism: the JWT carries `lastActivityAt`, refreshed on every authenticated
// request (rolling). When the gap since the last activity exceeds the role's
// limit, the jwt callback strips the token's identity so the session no longer
// authenticates anyone (see auth.config.js / lib/auth.js). `maxAge` on the
// session is set to the longest limit so the cookie itself never outlives it.

export const HOUR_MS = 60 * 60 * 1000;

export const USER_IDLE_MS  = 6  * HOUR_MS;  // CUSTOMER inactivity limit
export const ADMIN_IDLE_MS = 12 * HOUR_MS;  // ADMIN / MODERATOR inactivity limit

// Cookie/session max age (seconds) — the longest idle limit, so an idle admin
// session is also capped at the framework level.
export const SESSION_MAX_AGE_S = 12 * 60 * 60;

// Idle limit (ms) for a given role.
export function idleLimitFor(role) {
  return role === "ADMIN" || role === "MODERATOR" ? ADMIN_IDLE_MS : USER_IDLE_MS;
}

// True when a token has been inactive beyond its role's limit. Tokens minted
// before this feature (no `lastActivityAt`) are treated as active — they get a
// fresh stamp on the next request rather than being logged out immediately.
export function isIdleExpired(token, now = Date.now()) {
  if (!token || !token.userId || !token.lastActivityAt) return false;
  return now - token.lastActivityAt > idleLimitFor(token.role);
}
