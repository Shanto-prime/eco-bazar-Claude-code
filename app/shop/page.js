// app/shop/page.js — Shop route.
// ShopClient calls useSearchParams(), so it must sit inside a <Suspense>
// boundary for Next.js static generation (avoids the CSR-bailout build error).

import { Suspense } from "react";
import ShopClient from "./ShopClient";
import { listProducts } from "../../lib/products-db";

export default async function ShopPage() {
  // Load the catalogue from the database so admin/moderator products appear.
  const products = await listProducts({ take: 100 });

  return (
    <Suspense fallback={null}>
      <ShopClient products={products} />
    </Suspense>
  );
}
