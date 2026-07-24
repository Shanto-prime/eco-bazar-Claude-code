// app/checkout/page.js
// Server wrapper around the checkout form. Its only job is to look up the
// signed-in user's default saved address (managed at /dashboard/settings) and
// hand it to the client as prefill.
//
// Guests are explicitly still supported — placeOrderAction allows a null
// userId — so an anonymous request just yields an empty prefill rather than a
// redirect. Nothing here is authoritative: the server action re-validates the
// submitted billing details and recomputes every price from the DB.

import { getCurrentUser } from "../../lib/auth-helpers";
import { prisma } from "../../lib/prisma";
import CheckoutClient from "./CheckoutClient";

export default async function CheckoutPage() {
  const session = await getCurrentUser();
  if (!session) return <CheckoutClient />;

  const [address, user] = await Promise.all([
    prisma.address.findFirst({
      where:   { userId: session.id, isDefault: true },
      // A user with saved addresses but no default (shouldn't happen — the
      // actions maintain one — but don't render an empty form if it does).
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUnique({
      where:  { id: session.id },
      select: { email: true, phone: true },
    }),
  ]);

  // Email/phone fall back to the account when the address carries none, so a
  // signed-in buyer with no saved address still gets those two filled in.
  const initialBilling = {
    firstName: address?.firstName || "",
    lastName:  address?.lastName  || "",
    company:   address?.company   || "",
    street:    address?.street    || "",
    country:   address?.country   || "",
    state:     address?.state     || "",   // Division (বিভাগ)
    city:      address?.city      || "",   // District / Jella (জেলা)
    zip:       address?.zip       || "",
    email:     user?.email        || "",
    phone:     address?.phone || user?.phone || "",
  };

  return <CheckoutClient initialBilling={initialBilling} />;
}
