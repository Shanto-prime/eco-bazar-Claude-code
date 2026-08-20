// lib/order-return.js
// Small, side-effect-free helpers for the customer "request a return" flow.
// Everything a page needs to decide "should I show the Return button?" and
// what the action will do — kept out of a server-actions file so client code
// can also read the same constants and eligibility rules.

export const RETURN_WINDOW_DAYS = 15;
const DAY_MS = 24 * 60 * 60 * 1000;

// The moment the order transitioned to DELIVERED, or null if it never has.
// Reads from the append-only OrderStatusEvent timeline the order pages already
// load, so no extra DB round-trip is needed.
export function deliveredAt(historyOrEvents) {
  const events = historyOrEvents || [];
  // History is ordered oldest→newest; take the FIRST DELIVERED transition (the
  // one that actually did the delivering — later duplicates shouldn't reset it).
  for (const h of events) {
    if (h.status === "DELIVERED") {
      return h.createdAt instanceof Date ? h.createdAt : new Date(h.createdAt);
    }
  }
  return null;
}

// Given `now`, when the return window closes (or null if never delivered).
export function returnDeadline(historyOrEvents, now = Date.now()) {
  const d = deliveredAt(historyOrEvents);
  if (!d) return null;
  const deadline = new Date(d.getTime() + RETURN_WINDOW_DAYS * DAY_MS);
  return deadline;
}

// Eligibility check the storefront calls when rendering the button, and the
// server action re-checks before committing — defence in depth.
//
// Returns { ok, reason?, deadline? }. `reason` is a machine key the UI can
// translate; `deadline` is included whenever the order was ever delivered so
// callers can show "until Sept 3" whether allowed or not.
//
//   viewerId  — the current session user id (must match order.userId)
//   order     — { status, userId, history: [{status, createdAt}, ...] }
//   now       — ms since epoch (for testability)
export function canRequestReturn({ viewerId, order, now = Date.now() }) {
  if (!order) return { ok: false, reason: "notFound" };
  // Ownership: only the buyer can request. Anonymous "guest" orders
  // (userId=null) can never request through this flow — they'd need to sign in
  // and let the guest→user linking (in signup) claim the order first.
  if (!viewerId || order.userId !== viewerId) return { ok: false, reason: "notOwner" };
  // Order must currently be DELIVERED — the terminal state we allow one
  // exception out of. Once returned (which flips it to CANCELLED), it's done.
  if (order.status !== "DELIVERED") return { ok: false, reason: "notDelivered" };

  const deadline = returnDeadline(order.history, now);
  if (!deadline) return { ok: false, reason: "notDelivered" };
  if (now > deadline.getTime()) return { ok: false, reason: "windowClosed", deadline };

  return { ok: true, deadline };
}
