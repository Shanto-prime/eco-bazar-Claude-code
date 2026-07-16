// app/shop/page.js — Shop route.
// ShopClient calls useSearchParams(), so it must sit inside a <Suspense>
// boundary for Next.js static generation (avoids the CSR-bailout build error).

import { Suspense } from "react";
import ShopClient from "./ShopClient";

export default function ShopPage() {
  return (
    <Suspense fallback={null}>
      <ShopClient />
    </Suspense>
  );
}
