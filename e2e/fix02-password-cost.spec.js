// e2e/fix02-password-cost.spec.js
//
// FIX 2 — changing your password weakened its hash.
//
// dashboard/settings hashed at bcrypt cost 10 while signup, password reset and
// admin-created accounts all used 12. So the act of changing your password made
// the stored hash cheaper to brute-force than the one you started with. All four
// call sites now read BCRYPT_COST from lib/password.js.
//
// bcrypt encodes the cost in the hash itself ("$2a$12$…"), which is what makes
// this directly assertable.

import { test, expect } from "@playwright/test";
import { newPrisma } from "./db";
import { login } from "./helpers";

// A throwaway account, created and deleted by this spec, so no seeded login's
// password is disturbed.
const EMAIL = "e2e-fix02@ecobazar.test";
const USERNAME = "e2efix02";
const PASSWORD = "originalPassword1";
const NEW_PASSWORD = "replacementPassword2";

let prisma;

async function hashOf() {
  const u = await prisma.user.findFirst({ where: { username: USERNAME }, select: { passwordHash: true } });
  return u?.passwordHash ?? null;
}

// "$2a$12$..." / "$2b$12$..." → 12
function costOf(hash) {
  const m = /^\$2[aby]?\$(\d{2})\$/.exec(hash || "");
  return m ? Number(m[1]) : null;
}

test.beforeAll(async () => {
  prisma = newPrisma();
});

test.beforeEach(async () => {
  await prisma.user.deleteMany({ where: { username: USERNAME } });
});

test.afterAll(async () => {
  await prisma.user.deleteMany({ where: { username: USERNAME } });
  await prisma.$disconnect();
});

test.describe("Fix 2 — password hashing cost", () => {
  test("signup hashes at cost 12", async ({ request }) => {
    const res = await request.post("/api/auth/signup", {
      data: { name: "Fix02", username: USERNAME, email: EMAIL, password: PASSWORD },
    });
    // The signup route is rate-limited to 5/hour per IP; a 429 here means an
    // earlier run used the budget, not that the fix regressed.
    test.skip(res.status() === 429, "signup rate limit reached — rerun in a few minutes");
    expect(res.status()).toBe(200);

    expect(costOf(await hashOf())).toBe(12);
  });

  test("changing the password keeps the cost at 12 (was silently 10)", async ({ page, request }) => {
    const res = await request.post("/api/auth/signup", {
      data: { name: "Fix02", username: USERNAME, email: EMAIL, password: PASSWORD },
    });
    test.skip(res.status() === 429, "signup rate limit reached — rerun in a few minutes");
    expect(res.status()).toBe(200);

    const before = await hashOf();
    expect(costOf(before)).toBe(12);

    await login(page, USERNAME, PASSWORD);
    await page.goto("/dashboard/settings", { waitUntil: "networkidle" });

    await page.locator('input[name="currentPassword"]').fill(PASSWORD);
    await page.locator('input[name="newPassword"]').fill(NEW_PASSWORD);
    await page.locator('input[name="confirmPassword"]').fill(NEW_PASSWORD);
    await page.getByRole("button", { name: /change password|update password/i }).first().click();

    // Wait for the hash to actually change, then assert the new one's cost.
    await expect.poll(hashOf, { timeout: 20_000 }).not.toBe(before);
    expect(costOf(await hashOf())).toBe(12);
  });
});
