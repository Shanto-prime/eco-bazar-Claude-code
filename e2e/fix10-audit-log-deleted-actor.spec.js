// e2e/fix10-audit-log-deleted-actor.spec.js
//
// FIX 10   deleting a user broke /dashboard/audit-log permanently.
//
// Found by this suite rather than by reading the code: a WebServer stack trace
// appeared while another spec was running.
//
//   TypeError at app/dashboard/audit-log/page.js:50
//   <div className="font-medium">{e.actor.name || e.actor.email}</div>
//
// AuditLog.actorId is `String?` with `onDelete: SetNull`, and the schema comment
// says that is deliberate   "deleting a user preserves their audit trail (the row
// stays, the actor link is cleared) instead of blocking the delete". The page then
// dereferenced `e.actor` without a guard.
//
// So the supported admin action deleteUserAction() produced rows that crashed the
// audit log, and once created they stayed: the page was broken for good. The two
// render paths (desktop table + mobile cards) both needed the guard.

import { test, expect } from "@playwright/test";
import { newPrisma } from "./db";
import { authFile } from "./helpers";

const ORPHAN_ACTION = "e2e.fix10.orphan";

let prisma;

test.beforeAll(async () => {
    prisma = newPrisma();
});

test.afterEach(async () => {
    await prisma.auditLog.deleteMany({ where: { action: ORPHAN_ACTION } });
});

test.afterAll(async () => {
    await prisma.$disconnect();
});

test.describe("Fix 10   audit log survives a deleted actor", () => {
    test.use({ storageState: authFile("admin") });

    test("an audit row whose actor was deleted renders instead of crashing", async ({
        page,
    }) => {
        // Exactly what deleteUserAction leaves behind: a row with no actor.
        await prisma.auditLog.create({
            data: {
                actorId: null,
                action: ORPHAN_ACTION,
                entity: "User",
                entityId: "deleted-user-id",
                metadata: { note: "actor was deleted" },
            },
        });

        const res = await page.goto("/dashboard/audit-log", {
            waitUntil: "networkidle",
        });

        // The page must render at all   this used to be a server-side TypeError.
        expect(res?.status()).toBe(200);
        await expect(
            page.getByRole("heading", { name: /audit log/i }),
        ).toBeVisible();

        // And the orphaned row itself must be visible, labelled rather than blank.
        await expect(page.getByText(ORPHAN_ACTION).first()).toBeVisible();
        await expect(page.getByText(/deleted user/i).first()).toBeVisible();
    });

    test("rows with a live actor still show who did it", async ({ page }) => {
        const admin = await prisma.user.findFirst({
            where: { role: "ADMIN" },
            select: { id: true, email: true, name: true },
        });
        await prisma.auditLog.create({
            data: {
                actorId: admin.id,
                action: ORPHAN_ACTION,
                entity: "User",
                entityId: admin.id,
            },
        });

        await page.goto("/dashboard/audit-log", { waitUntil: "networkidle" });

        await expect(page.getByText(ORPHAN_ACTION).first()).toBeVisible();
        // The guard must not have flattened every actor into "Deleted user". Assert on
        // the page text rather than a locator: the row renders twice (a desktop table
        // and mobile cards), and whichever is hidden at this viewport would fail a
        // visibility check.
        const body = await page.locator("body").innerText();
        // The render is `actor?.name || actor?.email`, so a named account shows the
        // name   assert on whichever it would pick.
        expect(body).toContain(admin.name || admin.email);
    });
});
