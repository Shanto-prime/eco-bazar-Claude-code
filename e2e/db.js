// e2e/db.js — direct DB access for test setup/teardown.
//
// The mutating specs (order placement, currency switch) need to reset the
// database afterwards so the suite is repeatable and doesn't leak state into
// other specs. Playwright test files run in Node, so we talk to the same
// MongoDB the dev server uses, straight through Prisma. Each spec makes its own
// client in beforeAll and disconnects in afterAll.

import { PrismaClient } from "@prisma/client";

export function newPrisma() {
  return new PrismaClient();
}
