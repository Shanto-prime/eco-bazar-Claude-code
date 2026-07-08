// app/dashboard/products/[id]/edit/page.js — Edit product page.

import Link from "next/link";
import { notFound } from "next/navigation";
import ProductForm from "../../_form/ProductForm";
import { updateProductAction, deleteProductAction } from "../../_actions";
import { prisma } from "../../../../../lib/prisma";
import { requireRole, isAdmin } from "../../../../../lib/auth-helpers";

export default async function EditProduct({ params }) {
  const user = await requireRole(["ADMIN", "MODERATOR"], "/dashboard/products");
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: { orderBy: { sort: "asc" } }, createdBy: { select: { name: true, email: true } } },
  });
  if (!product) notFound();

  // Moderator restriction: only edit your own.
  if (user.role !== "ADMIN" && product.createdById !== user.id) {
    return (
      <div>
        <div className="text-sm mb-4">
          <Link href="/dashboard/products" className="text-eco-green">← Back to products</Link>
        </div>
        <div className="rounded-md bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3">
          You can&apos;t edit this product — it was added by <b>{product.createdBy?.name || product.createdBy?.email}</b>.
          Ask an admin to make changes.
        </div>
      </div>
    );
  }

  const boundUpdate = updateProductAction.bind(null, product.id);
  const boundDelete = deleteProductAction.bind(null, product.id);

  return (
    <div>
      <div className="text-sm mb-4">
        <Link href="/dashboard/products" className="text-eco-green">← Back to products</Link>
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-1">Edit product</h1>
      <div className="text-sm text-gray-500 mb-6">
        Added by <b>{product.createdBy?.name || product.createdBy?.email}</b> on {new Date(product.createdAt).toLocaleString()}
      </div>
      <ProductForm
        product={{ ...product, price: Number(product.price), oldPrice: product.oldPrice ? Number(product.oldPrice) : null }}
        action={boundUpdate}
        allowDelete={isAdmin(user)}
        onDelete={boundDelete}
      />
    </div>
  );
}
