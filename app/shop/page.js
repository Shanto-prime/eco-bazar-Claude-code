// app/shop/page.js   Shop route.
// Server-renders only the FIRST page (9 products) for the incoming search /
// category deep-link, plus the category list. Further pages and filter changes
// are fetched on demand by ShopClient from /api/products, so the browser never
// downloads the whole catalogue.

import ShopClient from "./ShopClient";
import {
    queryProducts,
    listCategories,
    getPriceBounds,
} from "../../lib/products-db";

export default async function ShopPage({ searchParams }) {
    const sp = await searchParams;
    const q = typeof sp?.q === "string" ? sp.q : "";
    const cat = typeof sp?.cat === "string" ? sp.cat : "";

    const [initial, categories, bounds] = await Promise.all([
        queryProducts({
            q: q || undefined,
            cat: cat || undefined,
            page: 1,
            perPage: 9,
        }),
        listCategories(),
        getPriceBounds(),
    ]);
    // Fallback when the catalogue is empty so the slider never lands on min===max
    // (which would collapse the track and make the knob undraggable).
    const priceBounds =
        bounds.max > bounds.min
            ? bounds
            : { min: 0, max: Math.max(100, bounds.max) };

    return (
        <ShopClient
            initial={initial}
            initialQ={q}
            initialCat={cat}
            categories={categories}
            priceBounds={priceBounds}
        />
    );
}
