// components/ProductNotFound.jsx
// "Soft 404" shown inside the product detail route when the requested slug
// doesn't match anything. We don't trigger Next.js's full 404 here so the
// user still sees a useful next step (a nearest-match suggestion + popular
// products), wrapped in the normal site chrome.

import Link from "next/link";
import ProductCard from "./ProductCard";
import Breadcrumb from "./Breadcrumb";
import { getT } from "../lib/i18n/server";
import { getActiveCurrency } from "../lib/store-config";
import { formatBaseMajor } from "../lib/currency";

export default async function ProductNotFound({ query, best, suggestions, popular }) {
  const { t } = await getT();
  const cur = await getActiveCurrency();
  return (
    <>
      <Breadcrumb items={[{ href: "/shop", label: t("productNotFound.breadcrumbShop") }, { label: t("productNotFound.breadcrumbNotFound") }]} />

      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-eco-bg text-eco-green text-3xl mb-4">
            <i className="fa-solid fa-magnifying-glass" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t("productNotFound.heading")}</h1>
          <p className="text-gray-500 text-sm sm:text-base mt-2">
            {t("productNotFound.noMatch")}{" "}
            <code className="bg-eco-bg px-2 py-0.5 rounded text-eco-dark break-all">
              /shop/{query}
            </code>
            {t("productNotFound.mayHaveMoved")}
          </p>
        </div>

        {/* "Did you mean?" — only when the best match is actually close --- */}
        {best && (
          <div className="mt-8 sm:mt-10 max-w-md mx-auto">
            <div className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-2 text-center">
              {t("productNotFound.didYouMean")}
            </div>
            <Link
              href={`/shop/${best.slug}`}
              className="block bg-white border border-eco-green rounded-xl p-4 hover:shadow-lg transition flex items-center gap-4"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-md bg-eco-bg grid place-items-center text-4xl sm:text-5xl shrink-0">
                {best.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-eco-green text-xs uppercase tracking-wider font-semibold">{t("productNotFound.closestMatch")}</div>
                <div className="font-bold text-lg truncate">{best.name}</div>
                <div className="text-sm text-gray-500">
                  {formatBaseMajor(best.price, cur)}
                  {best.oldPrice && <span className="line-through ml-2">{formatBaseMajor(best.oldPrice, cur)}</span>}
                </div>
              </div>
              <i className="fa-solid fa-arrow-right text-eco-green text-xl" />
            </Link>
          </div>
        )}

        {/* CTAs */}
        <div className="mt-8 sm:mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/shop"
            className="inline-flex items-center px-6 py-3 rounded-full bg-eco-green text-white font-medium hover:bg-emerald-600 transition"
          >
            {t("productNotFound.browseShop")} <i className="fa-solid fa-arrow-right ml-2" />
          </Link>
          <Link
            href={`/shop?q=${encodeURIComponent(query)}`}
            className="inline-flex items-center px-6 py-3 rounded-full border border-gray-200 text-gray-700 hover:border-eco-green hover:text-eco-green font-medium transition"
          >
            <i className="fa-solid fa-magnifying-glass mr-2" />
            {t("productNotFound.searchFor", { query })}
          </Link>
        </div>
      </section>

      {/* You might also like / Popular products ============================ */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 pb-14">
        <h2 className="text-xl sm:text-2xl font-bold mb-5 sm:mb-6">
          {suggestions?.length ? t("productNotFound.youMightLike") : t("productNotFound.popularProducts")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
          {(suggestions?.length ? suggestions : popular).map((p) => (
            <ProductCard key={p.slug} {...p} />
          ))}
        </div>
      </section>
    </>
  );
}
