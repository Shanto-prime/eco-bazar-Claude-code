// app/shop/[slug]/page.js — Server component for the product detail route.
// - If the slug matches a product → render the detail page.
// - If not → render a friendly "soft 404" with the nearest match + suggestions.
//   (We do NOT call notFound() here; the user explicitly wants to see related
//   products instead of the bare 404 page.)

import Breadcrumb from "../../../components/Breadcrumb";
import ProductCard from "../../../components/ProductCard";
import ProductDetailClient from "../../../components/ProductDetailClient";
import ProductNotFound from "../../../components/ProductNotFound";
import {
  products,
  findProductBySlug,
  findNearestProducts,
  isGoodSuggestion,
} from "../../../lib/data";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

// Dynamic SEO title based on the resolved product (or a generic title).
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = findProductBySlug(slug);
  return {
    title: product
      ? `${product.name} — Ecobazar`
      : "Product not found — Ecobazar",
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = findProductBySlug(slug);

  // --- Not found: render the soft-404 with suggestions ----------------------
  if (!product) {
    const nearest = findNearestProducts(slug, 4);
    const top     = nearest[0];
    const best    = top && isGoodSuggestion(slug, top) ? top.product : null;
    return (
      <ProductNotFound
        query={slug}
        best={best}
        suggestions={nearest.slice(best ? 1 : 0, 5).map((n) => n.product)}
        popular={products.slice(0, 4)}
      />
    );
  }

  // --- Found: render the full detail page ----------------------------------
  const related = products.filter((p) => p.slug !== product.slug).slice(0, 4);

  return (
    <>
      <Breadcrumb
        items={[
          { href: "/shop", label: "Shop" },
          { label: "Vegetables" },
          { label: product.name },
        ]}
      />

      <ProductDetailClient product={product} />

      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 mt-10 mb-14">
        <h2 className="text-2xl font-bold mb-6">Related Products</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {related.map((p) => <ProductCard key={p.slug} {...p} />)}
        </div>
      </section>
    </>
  );
}
