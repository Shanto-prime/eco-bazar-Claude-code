// app/wishlist/page.js — Saved items route.
// Loads the catalogue from the DB (so admin/moderator/demo products resolve,
// not just the 10 static seed slugs) and hands it to the client component,
// which filters by the wishlist slugs stored in CartContext (localStorage).

import WishlistClient from "./WishlistClient";
import { listProducts } from "../../lib/products-db";

export default async function WishlistPage() {
  const products = await listProducts({ take: 200 });
  return <WishlistClient products={products} />;
}
