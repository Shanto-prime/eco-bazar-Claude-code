"use server";

// app/dashboard/banners/_actions.js — ADMIN-only promo-banner CRUD.
// Each action re-checks the role (defence in depth), Zod-validates, mutates, and
// writes an AuditLog row. Changing a banner affects the public storefront, so
// every write revalidates the layout + home + the banner's landing page.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { PLACEMENT_KEYS, dealsHref } from "../../../lib/banners";

const ok   = (message) => ({ ok: true, message });
const fail = (error)   => ({ ok: false, error });

const BannerSchema = z.object({
  title:     z.string().trim().min(1, "Title is required.").max(120),
  imageUrl:  z.string().trim().min(1, "Upload a banner image."),
  placement: z.enum(PLACEMENT_KEYS),
  slug:      z.string().trim().toLowerCase()
    .min(2, "Slug must be at least 2 characters.")
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, digits and dashes only."),
  promoCode: z.string().trim().max(40).optional().or(z.literal("").transform(() => undefined)),
  targetTag: z.string().trim().min(1, "Enter the badge/tag applicable products carry.").max(60),
  // datetime-local sends "YYYY-MM-DDTHH:mm"; empty → no deadline.
  deadline:  z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  active:    z.coerce.boolean().optional().default(true),
  sort:      z.coerce.number().int().min(0).max(9999).optional().default(0),
});

function parse(formData) {
  return BannerSchema.parse({
    title:     formData.get("title"),
    imageUrl:  formData.get("imageUrl"),
    placement: formData.get("placement"),
    slug:      formData.get("slug"),
    promoCode: formData.get("promoCode") || undefined,
    targetTag: formData.get("targetTag"),
    deadline:  formData.get("deadline") || undefined,
    active:    formData.get("active") === "on" || formData.get("active") === "true",
    sort:      formData.get("sort") || 0,
  });
}

function toData(d) {
  return {
    title:     d.title,
    imageUrl:  d.imageUrl,
    placement: d.placement,
    slug:      d.slug,
    promoCode: d.promoCode ?? null,
    targetTag: d.targetTag,
    deadline:  d.deadline ? new Date(d.deadline) : null,
    active:    d.active,
    sort:      d.sort,
  };
}

async function assertSlugUnique(slug, exceptId = null) {
  const clash = await prisma.promoBanner.findFirst({
    where:  { slug, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
    select: { id: true },
  });
  if (clash) throw new Error(`Slug "${slug}" is already used by another banner.`);
}

function revalidate(slug) {
  revalidatePath("/", "layout"); // banners render in the storefront chrome/home
  revalidatePath("/dashboard/banners");
  if (slug) revalidatePath(dealsHref(slug));
}

export async function createBannerAction(formData) {
  const admin = await requireRole("ADMIN", "/dashboard/banners");

  let d;
  try { d = parse(formData); }
  catch (e) { return fail(e.issues?.[0]?.message || "Invalid banner."); }

  try { await assertSlugUnique(d.slug); }
  catch (e) { return fail(e.message); }

  const created = await prisma.promoBanner.create({
    data: { ...toData(d), createdById: admin.id },
  });
  await prisma.auditLog.create({
    data: { actorId: admin.id, action: "banner.create", entity: "PromoBanner", entityId: created.id, metadata: { slug: d.slug, placement: d.placement } },
  });

  revalidate(d.slug);
  return ok("Banner created.");
}

export async function updateBannerAction(bannerId, formData) {
  const admin = await requireRole("ADMIN", "/dashboard/banners");

  const existing = await prisma.promoBanner.findUnique({ where: { id: String(bannerId) } });
  if (!existing) return fail("Banner not found.");

  let d;
  try { d = parse(formData); }
  catch (e) { return fail(e.issues?.[0]?.message || "Invalid banner."); }

  try { await assertSlugUnique(d.slug, existing.id); }
  catch (e) { return fail(e.message); }

  await prisma.promoBanner.update({ where: { id: existing.id }, data: toData(d) });
  await prisma.auditLog.create({
    data: { actorId: admin.id, action: "banner.update", entity: "PromoBanner", entityId: existing.id, metadata: { slug: d.slug, placement: d.placement } },
  });

  revalidate(d.slug);
  if (existing.slug !== d.slug) revalidatePath(dealsHref(existing.slug));
  return ok("Banner updated.");
}

export async function deleteBannerAction(bannerId) {
  const admin = await requireRole("ADMIN", "/dashboard/banners");

  const existing = await prisma.promoBanner.findUnique({ where: { id: String(bannerId) } });
  if (!existing) return fail("Banner not found.");

  await prisma.promoBanner.delete({ where: { id: existing.id } });
  await prisma.auditLog.create({
    data: { actorId: admin.id, action: "banner.delete", entity: "PromoBanner", entityId: existing.id, metadata: { slug: existing.slug } },
  });

  revalidate(existing.slug);
  return ok("Banner deleted.");
}

// Quick toggle from the list without opening the form.
export async function toggleBannerAction(bannerId) {
  const admin = await requireRole("ADMIN", "/dashboard/banners");
  const existing = await prisma.promoBanner.findUnique({ where: { id: String(bannerId) }, select: { id: true, active: true, slug: true } });
  if (!existing) return fail("Banner not found.");

  await prisma.promoBanner.update({ where: { id: existing.id }, data: { active: !existing.active } });
  await prisma.auditLog.create({
    data: { actorId: admin.id, action: "banner.toggle", entity: "PromoBanner", entityId: existing.id, metadata: { active: !existing.active } },
  });

  revalidate(existing.slug);
  return ok(existing.active ? "Banner hidden." : "Banner shown.");
}
