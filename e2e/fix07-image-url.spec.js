// e2e/fix07-image-url.spec.js
//
// FIX 7 — the profile image accepted any string.
//
// ProfileSchema took `z.string().max(500)` and the signup route used
// `z.string().url()`. Neither is a real constraint for a value that ends up in an
// <img src>: Zod's .url() only checks the string PARSES as a URL, and both
// `javascript:alert(1)` and `data:text/html,…` do.
//
// isSafeImageUrl() now allows exactly two shapes — a "/uploads/…" path from our
// own upload routes, or an https:// URL (Vercel Blob in production, plus OAuth
// provider avatars, which the profile form resubmits in a hidden field and must
// keep accepting).
//
// Tested through the authenticated settings form rather than /api/auth/signup,
// because that route is rate-limited to 5 attempts per hour per IP and probing it
// exhausts the budget.

import { test, expect } from "@playwright/test";
import { newPrisma } from "./db";
import { authFile } from "./helpers";

const USER = { username: "customer", password: "customer" };

let prisma;
let userId;
let imageBefore;

test.beforeAll(async () => {
  prisma = newPrisma();
  const u = await prisma.user.findFirst({
    where:  { username: USER.username },
    select: { id: true, image: true },
  });
  if (!u) throw new Error(`Seed user "${USER.username}" missing — run npm run db:seed`);
  userId = u.id;
  imageBefore = u.image;
});

test.afterAll(async () => {
  // Restore the account's real avatar.
  await prisma.user.update({ where: { id: userId }, data: { image: imageBefore } });
  await prisma.$disconnect();
});

async function storedImage() {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { image: true } });
  return u?.image ?? null;
}

// Set User.image directly, then submit the profile form — which resubmits the
// current image in its hidden field. That is exactly the path an OAuth avatar
// takes, and the path a tampered value would take.
async function submitProfileWithImage(page, value) {
  await prisma.user.update({ where: { id: userId }, data: { image: value } });
  await page.goto("/dashboard/settings", { waitUntil: "networkidle" });
  await page.locator('input[name="name"]').first().fill("Fix07 Tester");
  await page.getByRole("button", { name: /save profile|update profile|save changes/i }).first().click();
  await page.waitForTimeout(2500);
  return page.locator("body").innerText();
}

test.describe("Fix 7 — profile image URLs are validated", () => {
  // Session comes from the "setup" project (e2e/auth.setup.js) — logging in
  // per test would trip the 10-per-15-minutes credentials rate limiter.
  test.use({ storageState: authFile("customer") });

  test("an https URL is accepted (OAuth avatars must keep working)", async ({ page }) => {
    const url = "https://lh3.googleusercontent.com/a/e2e-fix07.jpg";

    await submitProfileWithImage(page, url);

    // Saved, not rejected.
    expect(await storedImage()).toBe(url);
  });

  test("one of our own /uploads paths is accepted", async ({ page }) => {
    const path = "/uploads/avatars/e2e-fix07.png";

    await submitProfileWithImage(page, path);

    expect(await storedImage()).toBe(path);
  });

  test("a javascript: URL is rejected", async ({ page }) => {
    const text = await submitProfileWithImage(page, "javascript:alert(1)");

    // The action returns an error and the profile is not saved under that value.
    expect(text).toMatch(/image link isn't valid|Invalid image link/i);
  });

  test("a data: URL is rejected", async ({ page }) => {
    const text = await submitProfileWithImage(page, "data:text/html,<script>alert(1)</script>");

    expect(text).toMatch(/image link isn't valid|Invalid image link/i);
  });

  test("a path traversal attempt is rejected", async ({ page }) => {
    const text = await submitProfileWithImage(page, "/uploads/../../etc/passwd");

    expect(text).toMatch(/image link isn't valid|Invalid image link/i);
  });
});
