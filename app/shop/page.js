// app/shop/page.js — Shop route.
// ShopClient calls useSearchParams(), so it must sit inside a <Suspense>
// boundary for Next.js static generation (avoids the CSR-bailout build error).

import { Suspense } from "react";
import ShopClient from "./ShopClient";
import { listProducts } from "../../lib/products-db";
import { getLocale } from "../../lib/i18n/server";

export default async function ShopPage() {
  // Load the catalogue from the database so admin/moderator products appear,
  // localized to the active language.
  const locale = await getLocale();
  const products = await listProducts({ take: 100, locale });

  return (
    <Suspense fallback={null}>
      <ShopClient products={products} />
    </Suspense>
  );
}
