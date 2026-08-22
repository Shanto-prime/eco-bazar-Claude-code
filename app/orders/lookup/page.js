// app/orders/lookup/page.js   public "track my order" route.
//
// Not gated by middleware (which only protects /dashboard and /wishlist): the
// whole point is that a GUEST can reach it. Guest orders carry no userId, so they
// never show in /dashboard/orders   this is the only way to see one. The server
// action demands the order number and the checkout email together.
//
// `?number=` prefills the field so the checkout confirmation screen can link
// straight here with the number already filled in. The email is never put in a
// URL   it is the half of the pair that proves ownership.

import { getT } from "../../../lib/i18n/server";
import LookupClient from "./LookupClient";

export async function generateMetadata() {
    const { t } = await getT();
    return { title: t("lookup.metaTitle") };
}

export default async function OrderLookupPage({ searchParams }) {
    const params = await searchParams;
    const number =
        typeof params?.number === "string" ? params.number.slice(0, 40) : "";

    return <LookupClient initialNumber={number} />;
}
