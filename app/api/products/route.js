// app/api/products/route.js
// Public, read-only product search endpoint used by the shop's client-side
// pagination. Returns ONE page of results (default 9) plus the total count, so
// the browser never downloads the whole catalogue. All filtering/sorting runs
// in the database (see lib/products-db.js `queryProducts`).

import { NextResponse } from "next/server";
import { queryProducts } from "../../../lib/products-db";

export async function GET(req) {
  const sp = req.nextUrl.searchParams;

  const num = (key, fallback) => {
    const raw = sp.get(key);
    if (raw === null || raw === "") return fallback; // absent → fallback (Number(null) is 0, not NaN)
    const v = Number(raw);
    return Number.isFinite(v) ? v : fallback;
  };

  const result = await queryProducts({
    q:         sp.get("q") || undefined,
    cat:       sp.get("cat") || undefined,
    minPrice:  num("minPrice", 0),
    maxPrice:  num("maxPrice", 100),
    minRating: num("minRating", 0),
    sort:      sp.get("sort") || "latest",
    page:      num("page", 1),
    perPage:   num("perPage", 9),
  });

  return NextResponse.json(result);
}
