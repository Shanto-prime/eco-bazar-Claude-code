// app/wishlist/page.js   Saved items route. Signed-in only (middleware.js gates
// /wishlist), so there is always a user here.
//
// The wishlist is stored in the DB, one row per user (Cart.wishlist   see
// lib/cart-actions.js), NOT in localStorage. That means the server can read it
// directly and fetch exactly the saved products.
//
// It used to load `listProducts({ take: 200 })` and let the browser filter by
// slug, which shipped the entire catalogue on every visit and   worse   silently
// dropped any wishlisted product that fell outside those 200 rows.

import WishlistClient from "./WishlistClient";
import { listProductsBySlugs } from "../../lib/products-db";
import { getCurrentUser } from "../../lib/auth-helpers";
import { prisma } from "../../lib/prisma";

export default async function WishlistPage() {
    const user = await getCurrentUser();

    // Defensive: middleware already redirects anonymous visitors, so this only
    // guards against the page being reached some other way.
    if (!user) return <WishlistClient products={[]} />;

    const cart = await prisma.cart.findUnique({
        where: { userId: user.id },
        select: { wishlist: true },
    });

    // Cart.wishlist is Json   a plain array of product slugs.
    const slugs = Array.isArray(cart?.wishlist) ? cart.wishlist : [];
    const products = await listProductsBySlugs(slugs);

    return <WishlistClient products={products} />;
}
