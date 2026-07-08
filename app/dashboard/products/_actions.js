"use server";

// app/dashboard/products/_actions.js — Server actions for product CRUD.
// Each one re-checks the user's role (defence in depth — middleware already
// protects the route) and writes an AuditLog row for the action.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";

const ProductSchema = z.object({
  slug:        z.string().min(2).max(80).regex(/^[a-z0-9-]+$/, "lowercase letters, digits, dashes only"),
  name:        z.string().min(1).max(120),
  description: z.string().max(4000).optional(),
  price:       z.coerce.number().min(0).max(99999),
  oldPrice:    z.coerce.number().min(0).max(99999).optional().or(z.literal("").transform(() => undefined)),
  stock:       z.coerce.number().int().min(0).max(999999),
  badge:       z.string().max(40).optional(),
  imageUrls:   z.array(z.string()).optional().default([]),
});

function parseProduct(formData) {
  return ProductSchema.parse({
    slug:        formData.get("slug"),
    name:        formData.get("name"),
    description: formData.get("description") || undefined,
    price:       formData.get("price"),
    oldPrice:    formData.get("oldPrice") || undefined,
    stock:       formData.get("stock"),
    badge:       formData.get("badge") || undefined,
    imageUrls:   formData.getAll("imageUrls").filter(Boolean),
  });
}

export async function createProductAction(formData) {
  const user = await requireRole(["ADMIN", "MODERATOR"], "/dashboard/products/new");
  const data = parseProduct(formData);

  const created = await prisma.product.create({
    data: {
      slug:        data.slug,
      name:        data.name,
      description: data.description,
      price:       data.price,
      oldPrice:    data.oldPrice,
      stock:       data.stock,
      badge:       data.badge,
      createdById: user.id,
      images: {
        create: data.imageUrls.map((url, i) => ({ url, sort: i })),
      },
    },
  });

  await prisma.auditLog.create({
    data: { actorId: user.id, action: "product.create", entity: "Product", entityId: created.id, metadata: { slug: created.slug } },
  });

  revalidatePath("/dashboard/products");
  revalidatePath("/shop");
  redirect(`/dashboard/products/${created.id}/edit?created=1`);
}

export async function updateProductAction(productId, formData) {
  const user = await requireRole(["ADMIN", "MODERATOR"], `/dashboard/products/${productId}/edit`);
  const existing = await prisma.product.findUnique({ where: { id: productId }, include: { images: true } });
  if (!existing) throw new Error("Product not found.");

  // Moderators can only edit products they created.
  if (user.role !== "ADMIN" && existing.createdById !== user.id) {
    throw new Error("You can only edit products you created.");
  }

  const data = parseProduct(formData);

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: {
        slug:        data.slug,
        name:        data.name,
        description: data.description,
        price:       data.price,
        oldPrice:    data.oldPrice,
        stock:       data.stock,
        badge:       data.badge,
      },
    });
    // Re-sync images: simple approach — drop and re-add.
    await tx.productImage.deleteMany({ where: { productId } });
    if (data.imageUrls.length) {
      await tx.productImage.createMany({
        data: data.imageUrls.map((url, i) => ({ productId, url, sort: i })),
      });
    }
    await tx.auditLog.create({
      data: { actorId: user.id, action: "product.update", entity: "Product", entityId: productId, metadata: { slug: data.slug } },
    });
  });

  revalidatePath("/dashboard/products");
  revalidatePath(`/shop/${data.slug}`);
  revalidatePath("/shop");
}

export async function deleteProductAction(productId) {
  const user = await requireRole("ADMIN", `/dashboard/products/${productId}/edit`);
  const existing = await prisma.product.findUnique({ where: { id: productId } });
  if (!existing) return;

  await prisma.product.delete({ where: { id: productId } });
  await prisma.auditLog.create({
    data: { actorId: user.id, action: "product.delete", entity: "Product", entityId: productId, metadata: { slug: existing.slug, name: existing.name } },
  });

  revalidatePath("/dashboard/products");
  revalidatePath("/shop");
  redirect("/dashboard/products");
}
