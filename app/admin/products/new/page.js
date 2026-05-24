// app/admin/products/new/page.js — Add product page.
import Link from "next/link";
import ProductForm from "../_form/ProductForm";
import { createProductAction } from "../_actions";
import { requireUser } from "../../../../lib/auth-helpers";

export default async function NewProduct() {
  await requireUser({ role: "MODERATOR", redirectTo: "/admin/login" });
  return (
    <div>
      <div className="text-sm mb-4">
        <Link href="/admin/products" className="text-eco-green">← Back to products</Link>
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Add product</h1>
      <ProductForm action={createProductAction} />
    </div>
  );
}
