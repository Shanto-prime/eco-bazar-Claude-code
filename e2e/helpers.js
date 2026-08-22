// e2e/helpers.js   shared test helpers.
import fs from "node:fs";
import path from "node:path";
import { expect } from "@playwright/test";

// Sign in through the real credentials form.
//
// Two dev-mode hazards this guards against:
//   1. Pre-hydration native submit   clicking the submit button before Next has
//      hydrated does a plain GET (URL ends up /login?username=…), and the SPA
//      navigation never happens. Waiting for networkidle ensures the client
//      bundle has loaded + run before we interact.
//   2. Cold-compile latency   the FIRST hit of /dashboard in `next dev` compiles
//      on demand and can take well over 20s, so the post-login wait is generous.
export async function login(page, username, password) {
    await page.goto("/login", { waitUntil: "networkidle" });
    await page.locator("#username").fill(username);
    await page.locator("#password").fill(password);
    // Sanity: the field is interactive (hydrated forms keep the typed value).
    await expect(page.locator("#username")).toHaveValue(username);

    await page
        .getByRole("button", { name: /log ?in|sign ?in/i })
        .first()
        .click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
        timeout: 60_000,
    });
}

// ---------------------------------------------------------------------------
// Reusable signed-in sessions
// ---------------------------------------------------------------------------
// The app rate-limits credential logins to 10 attempts per 15 minutes PER
// IDENTIFIER (lib/rate-limit.js, applied in lib/auth.js authorize()). That is
// correct behaviour for a store   but a suite that calls login() in every test
// blows through it, and the 11th login simply never redirects. The failure looks
// exactly like a product bug: `page.waitForURL` times out with the browser still
// sitting on /login.
//
// So: log in ONCE per user, save the session cookie, and let specs adopt it with
// `test.use({ storageState: authFile("customer") })`. The state is reused for 10
// minutes, which keeps a whole suite run down to one login per account.
const AUTH_DIR = path.join("test-results", ".auth");
const AUTH_TTL_MS = 10 * 60 * 1000;

export function authFile(username) {
    return path.join(AUTH_DIR, `${username}.json`);
}

export async function ensureAuthState(browser, username, password) {
    const file = authFile(username);
    fs.mkdirSync(AUTH_DIR, { recursive: true });

    // Fresh enough to reuse? Session cookies last far longer than this window.
    try {
        if (Date.now() - fs.statSync(file).mtimeMs < AUTH_TTL_MS) return file;
    } catch {
        /* not written yet */
    }

    const context = await browser.newContext();
    const page = await context.newPage();
    try {
        await login(page, username, password);
        await context.storageState({ path: file });
    } finally {
        await context.close();
    }
    return file;
}

// Order numbers are "ECO-" + 8 characters drawn from a CSPRNG over the alphabet
// 23456789ABCDEFGHJKLMNPQRSTUVWXYZ (no I/O/0/1). They used to be the last 6
// digits of Date.now(), which repeated every ~16.7 minutes and collided with the
// @unique index   so any spec matching /ECO-\d{6}/ is out of date.
export const ORDER_NUMBER_RE = /ECO-[2-9A-HJ-NP-Z]{8}/;

// Pick the first real option of a <select>, returning the value chosen.
export async function selectFirstOption(page, name) {
    const sel = page.locator(`select[name="${name}"]`);
    await sel.waitFor({ state: "visible" });
    const values = await sel
        .locator("option")
        .evaluateAll((os) => os.map((o) => o.value).filter(Boolean));
    if (values.length === 0)
        throw new Error(`<select name="${name}"> has no options`);
    await sel.selectOption(values[0]);
    return values[0];
}

// Fill the Bangladesh cascading address selectors. Checkout and the settings
// address book render the SAME hierarchy from lib/bd-geo.js but under different
// field names, matching what each one submits:
//   checkout      → division / district / thana
//   address book  → state    / city     / thana  (the Address column names)
//
// Each level must be chosen before the next is enabled, so this is sequential by
// necessity. Both return the chosen values so a caller can assert on them.
export async function fillCheckoutAddress(page) {
    const division = await selectFirstOption(page, "division");
    await page.waitForTimeout(200);
    const district = await selectFirstOption(page, "district");
    await page.waitForTimeout(200);
    const thana = await selectFirstOption(page, "thana");
    return { division, district, thana };
}

// The settings address book names the same three fields state/city/thana, matching
// the Address columns.
export async function fillAddressBookGeo(page) {
    const state = await selectFirstOption(page, "state");
    await page.waitForTimeout(200);
    const city = await selectFirstOption(page, "city");
    await page.waitForTimeout(200);
    const thana = await selectFirstOption(page, "thana");
    return { state, city, thana };
}

// Seed a guest cart directly, bypassing the shop UI. Prices here are display-only
//   the server recomputes them   which is exactly what the repricing spec exploits.
export async function seedGuestCart(page, items) {
    await page.evaluate(
        (payload) => {
            localStorage.setItem("ecobazar-cart-v1", JSON.stringify(payload));
        },
        { items, coupon: null, ownerId: null },
    );
}
