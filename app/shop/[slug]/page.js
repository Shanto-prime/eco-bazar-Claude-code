// app/shop/[slug]/page.js — Server component for the product detail route.
// - Loads the product from the DATABASE (so admin/moderator products work).
// - If the slug isn't in the DB → render a friendly "soft 404" with nearest
//   matches from the static starter catalogue as suggestions.

import Breadcrumb from "../../../components/Breadcrumb";
import ProductCard from "../../../components/ProductCard";
import ProductDetailClient from "../../../components/ProductDetailClient";
import ProductNotFound from "../../../components/ProductNotFound";
import { listProducts, getProductBySlug } from "../../../lib/products-db";
import { getT } from "../../../lib/i18n/server";
import { findNearestProducts, isGoodSuggestion, products as staticProducts } from "../../../lib/data";

// Dynamic SEO title based on the resolved product (or a generic title).
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { t } = await getT();
  const product = await getProductBySlug(slug);
  return {
    title: product ? `${product.name}${t("meta.productTitleSuffix")}` : t("meta.productNotFoundTitle"),
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const { t } = await getT();
  const product = await getProductBySlug(slug);

  // --- Not found: soft-404 with suggestions from the starter catalogue -------
  if (!product) {
    const nearest = findNearestProducts(slug, 4);
    const top     = nearest[0];
    const best    = top && isGoodSuggestion(slug, top) ? top.product : null;
    return (
      <ProductNotFound
        query={slug}
        best={best}
        suggestions={nearest.slice(best ? 1 : 0, 5).map((n) => n.product)}
        popular={staticProducts.slice(0, 4)}
      />
    );
  }

  // --- Found: full detail page + related from the DB ------------------------
  const all = await listProducts({ take: 5 });
  const related = all.filter((p) => p.slug !== product.slug).slice(0, 4);

  return (
    <>
      <Breadcrumb
        items={[
          { href: "/shop", label: t("nav.shop") },
          { label: product.name },
        ]}
      />

      <ProductDetailClient product={product} />

      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 mt-10 mb-14">
        <h2 className="text-2xl font-bold mb-6">{t("common.relatedProducts")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {related.map((p) => <ProductCard key={p.slug} {...p} />)}
        </div>
      </section>
    </>
  );
}
