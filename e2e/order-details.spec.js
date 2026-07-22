// e2e/order-details.spec.js — the per-order "See details" popup with the full
// status timeline + messages, and the customer's compact "last update" row.
//
// Seeds a known order for the customer (with a 2-entry history incl. notes) in
// beforeAll, then deletes it in afterAll — so the assertions are deterministic
// regardless of what else is in the DB.
import { test, expect } from "@playwright/test";
import { newPrisma } from "./db";
import { login } from "./helpers";

const NUMBER = "ECO-E2ED01";

let prisma;
let orderId;

test.beforeAll(async () => {
  prisma = newPrisma();
  const customer = await prisma.user.findUnique({ where: { username: "customer" } });
  const admin    = await prisma.user.findUnique({ where: { username: "admin" } });
  if (!customer || !admin) throw new Error("Seed users missing — run npm run db:seed");

  // Remove a stale copy from a previous run, then create fresh.
  await prisma.order.deleteMany({ where: { number: NUMBER } });
  const t0 = new Date(Date.now() - 60 * 60 * 1000); // an hour ago
  const t1 = new Date();
  const order = await prisma.order.create({
    data: {
      number: NUMBER,
      userId: customer.id,
      email: customer.email,
      firstName: "Demo", lastName: "Customer", street: "1 Test Rd",
      subtotal: 1499, total: 1499, status: "SHIPPED",
      notes: "Please leave the parcel at the door.",
      items: { create: [{ productSlug: "green-apple", productName: "Green Apple", unitPrice: 1499, qty: 1 }] },
      history: {
        create: [
          { status: "PENDING", note: "Order placed", createdAt: t0 },
          { status: "SHIPPED", actorId: admin.id, note: "Handed to courier", createdAt: t1 },
        ],
      },
    },
  });
  orderId = order.id;
});

test.afterAll(async () => {
  await prisma.order.deleteMany({ where: { number: NUMBER } });
  await prisma.$disconnect();
});

test.describe("Order details popup", () => {
  test("customer row shows the last update and opens full history", async ({ page }) => {
    await login(page, "customer", "customer");
    await page.goto("/dashboard/orders", { waitUntil: "networkidle" });

    // The desktop table row for our order.
    const row = page.locator("tr", { hasText: NUMBER });
    await expect(row).toBeVisible();

    // Customer sees only the LATEST update inline (SHIPPED), not the whole list.
    await expect(row.getByText(/last update/i)).toBeVisible();

    // Open the details popup from that row.
    await row.getByRole("button", { name: /see details/i }).click();

    // Popup shows the full timeline: BOTH statuses, the courier note (a message),
    // and the customer's own order note.
    const dialog = page.getByText(/order ECO-E2ED01/i);
    await expect(dialog).toBeVisible();
    await expect(page.getByText(/timeline/i)).toBeVisible();
    await expect(page.getByText(/handed to courier/i)).toBeVisible();       // status-change message
    await expect(page.getByText(/leave the parcel at the door/i)).toBeVisible(); // customer note
    await expect(page.getByText("Order placed")).toBeVisible();             // earlier timeline entry
  });
});
