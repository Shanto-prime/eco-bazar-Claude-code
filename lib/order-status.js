// lib/order-status.js
// Single source of truth for the OrderStatus list and its presentation.
//
// This lives OUTSIDE any "use server" file on purpose. It previously sat in
// app/dashboard/orders/_actions.js as `export const ORDER_STATUSES`, which
// crashed the whole orders page under Turbopack:
//
//   Error: A "use server" file can only export async functions, found object.
//
// A "use server" module may export async functions and nothing else — every
// export becomes a callable server-action reference. The production build
// tree-shook the unused const and compiled fine, so the failure only ever
// appeared in dev. Keep constants in plain modules like this one.
//
// Values must match the OrderStatus enum in prisma/schema.prisma.

export const ORDER_STATUSES = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];

// Terminal states: reopening one would let stock and payment state drift out of
// sync with fulfilment with no way back. Enforced in the server action; the UI
// disables the picker to match.
export const TERMINAL_STATUSES = ["DELIVERED", "CANCELLED"];

export const isTerminal = (status) => TERMINAL_STATUSES.includes(status);

// Pill/background styling per status. bg-*-100 pairs are remapped for dark mode
// in globals.css, so these read correctly in both themes.
export const STATUS_PILL = {
  PENDING:   "bg-amber-100   text-amber-700",
  PAID:      "bg-blue-100    text-blue-700",
  SHIPPED:   "bg-purple-100  text-purple-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-gray-200    text-gray-700",
};

// Text-only variant, for the inline <select> in StatusSelect.
export const STATUS_TEXT = {
  PENDING:   "text-amber-700",
  PAID:      "text-blue-700",
  SHIPPED:   "text-purple-700",
  DELIVERED: "text-emerald-700",
  CANCELLED: "text-gray-700",
};

// "PENDING" → "dashboard.statusPending" — the existing locale key convention.
export const statusKey = (status) =>
  `dashboard.status${status[0]}${status.slice(1).toLowerCase()}`;
