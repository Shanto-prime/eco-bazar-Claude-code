// app/dashboard/products/new/page.js — Add product page.
import Link from "next/link";
import ProductForm from "../_form/ProductForm";
import { createProductAction } from "../_actions";
import { requireRole } from "../../../../lib/auth-helpers";
import { getT } from "../../../../lib/i18n/server";

export default async function NewProduct() {
  const { t } = await getT();
  await requireRole(["ADMIN", "MODERATOR"], "/dashboard/products/new");
  return (
    <div>
      <div className="text-sm mb-4">
        <Link href="/dashboard/products" className="text-eco-green">{t("dashboard.backToProducts")}</Link>
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">{t("dashboard.addProduct")}</h1>
      <ProductForm action={createProductAction} />
    </div>
  );
}
