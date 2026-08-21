// app/shop/[slug]/page.js   Server component for the product detail route.
// - Loads the product from the DATABASE (so admin/moderator products work).
// - If the slug isn't in the DB → render a friendly "soft 404" whose suggestions
//   also come from the DATABASE.
//
// The suggestions used to be scored against lib/data.js (the static seed
// catalogue), which meant the 404 page could recommend a product an admin had
// deleted   clicking it produced another 404   and priced everything at its seed
// value rather than the current one.

import Breadcrumb from "../../../components/Breadcrumb";
import ProductCard from "../../../components/ProductCard";
import ProductDetailClient from "../../../components/ProductDetailClient";
import ProductNotFound from "../../../components/ProductNotFound";
import {
    listProducts,
    getProductBySlug,
    listSuggestCandidates,
    listProductsBySlugs,
    listBestSellers,
} from "../../../lib/products-db";
import { getT } from "../../../lib/i18n/server";
import {
    findNearestProducts,
    isGoodSuggestion,
} from "../../../lib/product-suggest";

// Dynamic SEO title based on the resolved product (or a generic title).
export async function generateMetadata({ params }) {
    const { slug } = await params;
    const { t } = await getT();
    const product = await getProductBySlug(slug);
    return {
        title: product
            ? `${product.name}${t("meta.productTitleSuffix")}`
            : t("meta.productNotFoundTitle"),
    };
}

export default async function ProductPage({ params }) {
    const { slug } = await params;
    const { t } = await getT();
    const product = await getProductBySlug(slug);

    // --- Not found: soft-404 with suggestions from the DB ---------------------
    if (!product) {
        // Score a cheap {slug,name} projection, then load the winners properly so the
        // cards show live prices/images and can only link to products that exist.
        const candidates = await listSuggestCandidates();
        const nearest = findNearestProducts(slug, candidates, 5);
        const top = nearest[0];
        const bestSlug =
            top && isGoodSuggestion(slug, top) ? top.product.slug : null;

        const suggestSlugs = nearest
            .map((n) => n.product.slug)
            .filter((s) => s !== bestSlug)
            .slice(0, 4);

        const [bestArr, suggestions, popular] = await Promise.all([
            bestSlug ? listProductsBySlugs([bestSlug]) : Promise.resolve([]),
            listProductsBySlugs(suggestSlugs),
            listBestSellers(4),
        ]);

        return (
            <ProductNotFound
                query={slug}
                best={bestArr[0] ?? null}
                suggestions={suggestions}
                popular={popular}
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
                <h2 className="text-2xl font-bold mb-6">
                    {t("common.relatedProducts")}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    {related.map((p) => (
                        <ProductCard key={p.slug} {...p} />
                    ))}
                </div>
            </section>
        </>
    );
}
