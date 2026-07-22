// app/dashboard/products/page.js — Product list.
// Moderators see only their own products; admins see all.

import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireRole } from "../../../lib/auth-helpers";
import { formatMoney } from "../../../lib/money";
import { getActiveCurrency } from "../../../lib/store-config";
import { getT } from "../../../lib/i18n/server";

export default async function DashboardProducts({ searchParams }) {
  const { t } = await getT();
  const user = await requireRole(["ADMIN", "MODERATOR"], "/dashboard/products");
  const cur = await getActiveCurrency();
  const sp = await searchParams;
  const q = (sp?.q || "").toString().trim();
  const lowStockOnly = sp?.lowStock === "1";

  // MongoDB `contains` is case-sensitive by default; opt into Prisma's
  // `mode: "insensitive"` (supported by the Mongo connector) for friendly search.
  const where = {};
  if (q) where.OR = [
    { name: { contains: q, mode: "insensitive" } },
    { slug: { contains: q, mode: "insensitive" } },
  ];
  if (lowStockOnly)          where.stock = { lt: 5 };
  if (user.role !== "ADMIN") where.createdById = user.id;

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true, email: true } }, images: { take: 1, orderBy: { sort: "asc" } } },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("dashboard.products")}</h1>
        <Link href="/dashboard/products/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-eco-green text-white text-sm min-h-[44px]">
          <i className="fa-solid fa-plus" /> {t("dashboard.addProduct")}
        </Link>
      </div>

      <form className="mb-5">
        <div className="relative max-w-sm">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input name="q" defaultValue={q} placeholder={t("dashboard.productsSearchPh")} className="eco-input pl-10" />
        </div>
        {lowStockOnly && (
          <Link href="/dashboard/products" className="text-xs text-eco-green mt-2 inline-block">
            {t("dashboard.showLowStockOnly")}
          </Link>
        )}
      </form>

      {products.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-10 text-center text-gray-500">
          {q ? t("dashboard.noProductsSearch") : t("dashboard.noProducts")}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3">{t("dashboard.colImage")}</th>
                  <th className="text-left px-4 py-3">{t("dashboard.colName")}</th>
                  <th className="text-left px-4 py-3">{t("dashboard.colPrice")}</th>
                  <th className="text-left px-4 py-3">{t("dashboard.colStock")}</th>
                  <th className="text-left px-4 py-3">{t("dashboard.colAddedBy")}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-3">
                      {p.images[0]?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0].url} alt="" className="w-12 h-12 object-cover rounded" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-gray-100 grid place-items-center text-gray-400">
                          <i className="fa-regular fa-image" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/products/${p.id}/edit`} className="font-medium hover:text-eco-green">{p.name}</Link>
                      <div className="text-xs text-gray-500">/{p.slug}</div>
                    </td>
                    <td className="px-4 py-3">{formatMoney(p.price, cur)}</td>
                    <td className="px-4 py-3">
                      <span className={p.stock < 5 ? "text-amber-600 font-semibold" : p.stock === 0 ? "text-red-500 font-semibold" : ""}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.createdBy?.name || p.createdBy?.email}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/dashboard/products/${p.id}/edit`} className="text-eco-green hover:underline text-sm">{t("dashboard.edit")}</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/dashboard/products/${p.id}/edit`}
                className="block bg-white border border-gray-200 rounded-lg p-3 flex gap-3"
              >
                {p.images[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0].url} alt="" className="w-16 h-16 object-cover rounded shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded bg-gray-100 grid place-items-center text-gray-400 shrink-0">
                    <i className="fa-regular fa-image text-xl" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="text-xs text-gray-500 truncate">/{p.slug}</div>
                  <div className="flex justify-between items-center mt-2 text-sm">
                    <span className="font-semibold">{formatMoney(p.price, cur)}</span>
                    <span className={`text-xs ${p.stock < 5 ? "text-amber-600 font-semibold" : "text-gray-500"}`}>
                      {t("dashboard.stockLabel")}{p.stock}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
