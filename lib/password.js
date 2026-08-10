// lib/password.js
// One bcrypt cost factor for the whole app.
//
// It used to be written inline at each call site, and drifted: signup, password
// reset and admin-created accounts hashed at 12, but the "change my password"
// action in dashboard/settings hashed at 10 — so changing your password made the
// stored hash cheaper to crack than the one signup created. A shared constant is
// the only way that stays fixed.
//
// Raising this is safe and backward compatible: bcrypt encodes the cost in the
// hash, so existing hashes keep verifying at whatever cost they were created
// with. Only newly written hashes use the new value.

export const BCRYPT_COST = 12;
