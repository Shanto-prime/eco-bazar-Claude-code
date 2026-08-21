// app/dashboard/banners/page.js   ADMIN only.
// Manage everything promotional on the storefront:
//   • IMAGE BANNERS (top announcement, below-list ad)   an uploaded image linking
//     to /deals/<slug>, which lists the products the promo applies to.
//     See lib/banners.js + the storefront <PromoBanners> component.
//   • HOT DEALS OFFERS   a timed percentage discount on one product, which is
//     what fills the storefront's Hot Deals area. See lib/offers.js and
//     app/dashboard/offers/_actions.js.
// Both are created from the same form; the dropdown at the top of it chooses
// which.

import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { getT } from "../../../lib/i18n/server";
import { toDollars } from "../../../lib/money";
import { discountedMinor } from "../../../lib/offers";
import BannersManager from "./_components/BannersManager";

export default async function DashboardBanners() {
    const { t } = await getT();
    await requireRole("ADMIN", "/dashboard/banners");

    const banners = await prisma.promoBanner.findMany({
        orderBy: [{ placement: "asc" }, { sort: "asc" }, { createdAt: "desc" }],
    });

    const rows = banners.map((b) => ({
        id: b.id,
        title: b.title,
        imageUrl: b.imageUrl,
        placement: b.placement,
        slug: b.slug,
        promoCode: b.promoCode,
        targetTag: b.targetTag,
        active: b.active,
        sort: b.sort,
        deadline: b.deadline ? b.deadline.toISOString() : null,
    }));

    // Soonest-ending first   the same order the storefront shows them in, so this
    // list doubles as the running schedule. Expired offers stay listed (greyed as
    // "Ended") so the admin can reuse or delete them deliberately.
    const offerRows = await prisma.productOffer.findMany({
        orderBy: { endsAt: "asc" },
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                    images: {
                        orderBy: { sort: "asc" },
                        take: 1,
                        select: { url: true },
                    },
                },
            },
        },
    });

    const offers = offerRows.map((o) => ({
        id: o.id,
        percentOff: o.percentOff,
        endsAt: o.endsAt.toISOString(),
        active: o.active,
        // Both figures in major units for display: what the customer pays now, and
        // the catalogue price it is discounted from.
        basePrice: toDollars(o.product?.price ?? 0),
        salePrice: toDollars(
            discountedMinor(o.product?.price ?? 0, o.percentOff),
        ),
        product: o.product
            ? {
                  id: o.product.id,
                  name: o.product.name,
                  slug: o.product.slug,
                  // `basePrice` is the field OfferForm/ProductPicker read, matching the shape
                  // the /api/products search returns.
                  basePrice: toDollars(o.product.price),
                  price: toDollars(o.product.price),
                  image: o.product.images?.[0]?.url ?? null,
              }
            : null,
    }));

    return (
        <div className="max-w-4xl">
            <header className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                    {t("banners.title")}
                </h1>
                <p className="mt-1.5 text-sm text-gray-500">
                    {t("banners.subtitle")}
                </p>
            </header>

            <BannersManager banners={rows} offers={offers} />
        </div>
    );
}
