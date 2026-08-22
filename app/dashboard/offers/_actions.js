"use server";

// app/dashboard/offers/_actions.js   ADMIN-only Hot Deals offer CRUD.
//
// An offer is a timed percentage discount on ONE product (see ProductOffer in
// prisma/schema.prisma). Because a live offer becomes the product's real selling
// price, these actions follow the same discipline as every other privileged
// write: re-check the role, Zod-validate, mutate, write an AuditLog row, and
// revalidate the storefront pages whose prices just changed.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { assertNotDemo } from "../../../lib/demo-accounts";
import { OFFER_MIN_PERCENT, OFFER_MAX_PERCENT } from "../../../lib/offers";

const ok = (message) => ({ ok: true, message });
const fail = (error) => ({ ok: false, error });

const OfferSchema = z.object({
    productId: z.string().trim().min(1, "Search for and select a product."),
    percentOff: z.coerce
        .number()
        .int()
        .min(
            OFFER_MIN_PERCENT,
            `Discount must be at least ${OFFER_MIN_PERCENT}%.`,
        )
        .max(
            OFFER_MAX_PERCENT,
            `Discount can't be more than ${OFFER_MAX_PERCENT}%.`,
        ),
    // datetime-local sends "YYYY-MM-DDTHH:mm" in the admin's local time.
    endsAt: z.string().trim().min(1, "Pick when the offer ends."),
    active: z.coerce.boolean().optional().default(true),
});

function parse(formData) {
    return OfferSchema.parse({
        productId: formData.get("productId"),
        percentOff: formData.get("percentOff"),
        endsAt: formData.get("endsAt"),
        active:
            formData.get("active") === "on" ||
            formData.get("active") === "true",
    });
}

// An offer whose deadline is already in the past would be dead on arrival: it
// could never appear in the Hot Deals area and never discount anything. Reject it
// at the door rather than silently storing a no-op.
function parseEndsAt(raw) {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime()))
        throw new Error("That end date isn't valid.");
    if (d.getTime() <= Date.now())
        throw new Error("The end date must be in the future.");
    return d;
}

// At most one LIVE offer per product   MongoDB can't express this as a partial
// unique index, so it is enforced here. Expired or switched-off rows are left
// alone, so a product's offer history survives.
async function assertNoOtherLiveOffer(productId, exceptId = null) {
    const clash = await prisma.productOffer.findFirst({
        where: {
            productId,
            active: true,
            endsAt: { gt: new Date() },
            ...(exceptId ? { NOT: { id: exceptId } } : {}),
        },
        select: { id: true },
    });
    if (clash)
        throw new Error(
            "That product already has a running offer. Edit or end that one first.",
        );
}

// Prices are baked into the storefront's rendered output, so an offer change has
// to invalidate every page that shows a price   not just the homepage.
function revalidate(productSlug) {
    revalidatePath("/", "layout");
    revalidatePath("/shop");
    if (productSlug) revalidatePath(`/shop/${productSlug}`);
    revalidatePath("/dashboard/banners");
}

export async function createOfferAction(formData) {
    const admin = await requireRole("ADMIN", "/dashboard/banners");
    const blocked = assertNotDemo(admin);
    if (blocked) return blocked;

    let d;
    try {
        d = parse(formData);
    } catch (e) {
        return fail(e.issues?.[0]?.message || "Invalid offer.");
    }

    const product = await prisma.product.findUnique({
        where: { id: d.productId },
        select: { id: true, slug: true, name: true },
    });
    if (!product) return fail("That product no longer exists.");

    let endsAt;
    try {
        endsAt = parseEndsAt(d.endsAt);
        await assertNoOtherLiveOffer(product.id);
    } catch (e) {
        return fail(e.message);
    }

    const created = await prisma.productOffer.create({
        data: {
            productId: product.id,
            percentOff: d.percentOff,
            endsAt,
            active: d.active,
            createdById: admin.id,
        },
    });
    await prisma.auditLog.create({
        data: {
            actorId: admin.id,
            action: "offer.create",
            entity: "ProductOffer",
            entityId: created.id,
            metadata: {
                productSlug: product.slug,
                productName: product.name,
                percentOff: d.percentOff,
                endsAt: endsAt.toISOString(),
            },
        },
    });

    revalidate(product.slug);
    return ok("Offer created.");
}

export async function updateOfferAction(offerId, formData) {
    const admin = await requireRole("ADMIN", "/dashboard/banners");
    const blocked = assertNotDemo(admin);
    if (blocked) return blocked;

    const existing = await prisma.productOffer.findUnique({
        where: { id: String(offerId) },
        include: { product: { select: { slug: true } } },
    });
    if (!existing) return fail("Offer not found.");

    let d;
    try {
        d = parse(formData);
    } catch (e) {
        return fail(e.issues?.[0]?.message || "Invalid offer.");
    }

    const product = await prisma.product.findUnique({
        where: { id: d.productId },
        select: { id: true, slug: true, name: true },
    });
    if (!product) return fail("That product no longer exists.");

    let endsAt;
    try {
        endsAt = parseEndsAt(d.endsAt);
        await assertNoOtherLiveOffer(product.id, existing.id);
    } catch (e) {
        return fail(e.message);
    }

    await prisma.productOffer.update({
        where: { id: existing.id },
        data: {
            productId: product.id,
            percentOff: d.percentOff,
            endsAt,
            active: d.active,
        },
    });
    await prisma.auditLog.create({
        data: {
            actorId: admin.id,
            action: "offer.update",
            entity: "ProductOffer",
            entityId: existing.id,
            metadata: {
                productSlug: product.slug,
                percentOff: d.percentOff,
                endsAt: endsAt.toISOString(),
            },
        },
    });

    revalidate(product.slug);
    // The offer may have been moved to a different product   refresh the old one's
    // page too, or it would keep showing a discount it no longer has.
    if (existing.product?.slug && existing.product.slug !== product.slug) {
        revalidatePath(`/shop/${existing.product.slug}`);
    }
    return ok("Offer updated.");
}

export async function deleteOfferAction(offerId) {
    const admin = await requireRole("ADMIN", "/dashboard/banners");
    const blocked = assertNotDemo(admin);
    if (blocked) return blocked;

    const existing = await prisma.productOffer.findUnique({
        where: { id: String(offerId) },
        include: { product: { select: { slug: true } } },
    });
    if (!existing) return fail("Offer not found.");

    await prisma.productOffer.delete({ where: { id: existing.id } });
    await prisma.auditLog.create({
        data: {
            actorId: admin.id,
            action: "offer.delete",
            entity: "ProductOffer",
            entityId: existing.id,
            metadata: {
                productSlug: existing.product?.slug ?? null,
                percentOff: existing.percentOff,
            },
        },
    });

    revalidate(existing.product?.slug);
    return ok("Offer deleted.");
}

// Quick on/off from the list without opening the form.
export async function toggleOfferAction(offerId) {
    const admin = await requireRole("ADMIN", "/dashboard/banners");
    const blocked = assertNotDemo(admin);
    if (blocked) return blocked;

    const existing = await prisma.productOffer.findUnique({
        where: { id: String(offerId) },
        include: { product: { select: { slug: true } } },
    });
    if (!existing) return fail("Offer not found.");

    // Switching an offer back on must not create a second live offer for the same
    // product, so re-run the same guard the form uses.
    if (!existing.active) {
        try {
            await assertNoOtherLiveOffer(existing.productId, existing.id);
        } catch (e) {
            return fail(e.message);
        }
    }

    await prisma.productOffer.update({
        where: { id: existing.id },
        data: { active: !existing.active },
    });
    await prisma.auditLog.create({
        data: {
            actorId: admin.id,
            action: "offer.toggle",
            entity: "ProductOffer",
            entityId: existing.id,
            metadata: {
                active: !existing.active,
                productSlug: existing.product?.slug ?? null,
            },
        },
    });

    revalidate(existing.product?.slug);
    return ok(existing.active ? "Offer paused." : "Offer resumed.");
}
