// e2e/fix03-timezone.spec.js
//
// FIX 3 — server-rendered dates used the server's timezone.
//
// components/LocalTime.jsx exists precisely so timestamps render in the VIEWER's
// timezone, but it was used in only one file. Eight other places called
// `new Date(x).toLocaleString()` inside a server component, so on Vercel (whose
// runtime is UTC) a Dhaka admin at UTC+6 read every date six hours out — and the
// date-only ones could land on the wrong day entirely.
//
// LocalTime renders `<time datetime="…ISO…">` and formats on the client, so the
// presence of a <time datetime> element is the observable difference. This spec
// also pins the behaviour by running one page under two timezones and requiring
// the rendered text to differ.

import { test, expect } from "@playwright/test";
import { newPrisma } from "./db";
import { authFile } from "./helpers";

let prisma;

test.beforeAll(async () => {
  prisma = newPrisma();
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

// Every page that renders a timestamp, and the role needed to see it.
const PAGES = [
  { path: "/dashboard/audit-log", as: "admin" },
  { path: "/dashboard/users",     as: "admin" },
  { path: "/dashboard/reviews",   as: "admin" },
  { path: "/dashboard/settings",  as: "admin" },
];

test.describe("Fix 3 — timestamps render in the viewer's timezone", () => {
  // Session comes from the "setup" project (e2e/auth.setup.js) — logging in
  // per test would trip the 10-per-15-minutes credentials rate limiter.
  test.use({ storageState: authFile("admin") });

  for (const { path } of PAGES) {
    test(`${path} renders <time datetime> rather than a server-formatted string`, async ({ page }) => {
      await page.goto(path, { waitUntil: "networkidle" });

      const times = page.locator("time[datetime]");
      const count = await times.count();
      // Some pages are empty on a fresh DB (no reviews yet); an empty table has no
      // dates to render, which is not a failure of this fix.
      test.skip(count === 0, `${path} has no timestamps to check on this dataset`);

      // Every rendered timestamp carries a machine-readable ISO value.
      const dt = await times.first().getAttribute("datetime");
      expect(dt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  }

  test("the same order timestamp reads differently in Dhaka and UTC", async ({ browser }) => {
    // A timestamp that is genuinely timezone-sensitive.
    const order = await prisma.order.findFirst({
      select: { number: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    test.skip(!order, "no orders in the database — run the checkout spec first");

    // Whitespace is normalised on both sides: Node and Chrome disagree on the
    // space before AM/PM (U+202F vs U+0020), which would otherwise make two
    // equivalent strings compare unequal.
    const norm = (s) => s.replace(/\s/g, " ").trim();
    const expected = (timeZone) =>
      norm(order.createdAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone }));

    const read = async (timezoneId) => {
      // storageState must be passed explicitly: a context built by hand does NOT
      // inherit the project's `test.use({ storageState })`, so without it this
      // page is anonymous and /dashboard/orders bounces to /unauthorized.
      const ctx = await browser.newContext({ timezoneId, storageState: authFile("admin") });
      const page = await ctx.newPage();
      await page.goto("/dashboard/orders", { waitUntil: "networkidle" });

      // POLL, don't snapshot. LocalTime server-renders a UTC string and swaps in
      // the viewer's timezone after mount, so reading once can catch the
      // pre-mount value — and if both contexts happened to be read early, two
      // genuinely-different timezones would look identical and the test would
      // pass or fail depending on timing. Waiting for the expected localised
      // string removes the race and asserts the actual value, not just "differs".
      const want = expected(timezoneId);
      await expect
        .poll(async () => norm(await page.locator("time[datetime]").first().innerText()), { timeout: 15_000 })
        .toBe(want);

      const text = norm(await page.locator("time[datetime]").first().innerText());
      await ctx.close();
      return text;
    };

    const dhaka = await read("Asia/Dhaka");           // UTC+6
    const la    = await read("America/Los_Angeles");  // UTC-7/8

    // Sanity: the two timezones really should disagree for this instant. If the
    // date were formatted on the server, both would show the same thing.
    expect(dhaka).not.toBe(la);
  });

  test("a promo deadline on /deals is client-formatted", async ({ page }) => {
    const banner = await prisma.promoBanner.findFirst({
      where:  { active: true, deadline: { not: null } },
      select: { slug: true },
    });
    test.skip(!banner, "no active banner with a deadline — set one to exercise this");

    await page.goto(`/deals/${banner.slug}`, { waitUntil: "networkidle" });
    await expect(page.locator("time[datetime]").first()).toBeVisible();
  });
});
