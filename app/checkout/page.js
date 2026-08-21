// app/checkout/page.js
// Server wrapper around the checkout form. Its only job is to look up the
// signed-in user's default saved address (managed at /dashboard/settings) and
// hand it to the client as prefill.
//
// Guests are explicitly still supported   placeOrderAction allows a null
// userId   so an anonymous request just yields an empty prefill rather than a
// redirect. Nothing here is authoritative: the server action re-validates the
// submitted billing details and recomputes every price from the DB.

import { getCurrentUser } from "../../lib/auth-helpers";
import { prisma } from "../../lib/prisma";
import { sanitizeBdGeo } from "../../lib/bd-geo";
import CheckoutClient from "./CheckoutClient";

export default async function CheckoutPage() {
    const session = await getCurrentUser();
    if (!session) return <CheckoutClient />;

    const [address, user] = await Promise.all([
        prisma.address.findFirst({
            where: { userId: session.id, isDefault: true },
            // A user with saved addresses but no default (shouldn't happen   the
            // actions maintain one   but don't render an empty form if it does).
            orderBy: { createdAt: "desc" },
        }),
        prisma.user.findUnique({
            where: { id: session.id },
            select: { email: true, phone: true },
        }),
    ]);

    // Email/phone fall back to the account when the address carries none, so a
    // signed-in buyer with no saved address still gets those two filled in.
    // Field names match the Address columns, which in turn match the option sets
    // lib/bd-geo.js gives both this form and the settings address book   so a saved
    // address prefills every selector, including thana.
    //
    // Sanitised first: addresses saved before the geography fix can hold old US
    // values ("Illinois"/"USA"). Passing those through would set a <select value>
    // with no matching <option>, which React silently blanks   the same broken
    // prefill, just moved. An invalid triple becomes empty instead.
    const geo = sanitizeBdGeo(address || {});

    const initialBilling = {
        firstName: address?.firstName || "",
        lastName: address?.lastName || "",
        company: address?.company || "",
        street: address?.street || "",
        state: geo.state, // Division (বিভাগ)
        city: geo.city, // District / Jella (জেলা)
        thana: geo.thana, // Thana / Upazila (থানা/উপজেলা)
        zip: address?.zip || "",
        email: user?.email || "",
        phone: address?.phone || user?.phone || "",
    };

    return <CheckoutClient initialBilling={initialBilling} />;
}
