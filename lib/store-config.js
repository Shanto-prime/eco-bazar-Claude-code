// lib/store-config.js
// Server-side access to the single StoreConfig row. Reads are used by every
// server component that renders money (via getActiveCurrency), and by the root
// layout to seed the client CurrencyProvider. Writes happen only in the admin
// currency action.

import "server-only";
import { prisma } from "./prisma";
import { resolveCurrency, BASE_CURRENCY, DEFAULT_RATES } from "./currency";

const SINGLETON_ID = "store";

// Raw config row, or a synthesized default when the row doesn't exist yet (fresh
// DB, before the admin has ever saved). Never throws on a missing row.
export async function getStoreConfig() {
  const row = await prisma.storeConfig.findUnique({ where: { id: SINGLETON_ID } });
  return {
    currency: row?.currency || BASE_CURRENCY,
    rates:    { ...DEFAULT_RATES, ...(row?.rates || {}) },
  };
}

// The fully-resolved active currency object the formatters take
// ({ code, symbol, decimals, position, rateToBase }).
export async function getActiveCurrency() {
  const cfg = await getStoreConfig();
  return resolveCurrency(cfg.currency, cfg.rates);
}

// Upsert the singleton. Caller (admin action) is responsible for auth + audit.
export async function saveStoreConfig({ currency, rates }) {
  return prisma.storeConfig.upsert({
    where:  { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, currency, rates },
    update: { currency, rates },
  });
}
