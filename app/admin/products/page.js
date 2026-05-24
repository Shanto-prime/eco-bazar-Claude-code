// app/admin/products/page.js — Product list. Server component with search.
// Moderators see only their own products; admins see all.

import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth-helpers";

export default async function AdminProducts({ searchParams }) {
  const user = await requireUser({ role: "MODERATOR", redirectTo: "/admin/login" });
  const sp = await searchParams;
  const q = (sp?.q || "").toString().trim();
  const lowStockOnly = sp?.lowStock === "1";

  const where = {};
  if (q) where.OR = [
    { name: { contains: q, mode: "insensitive" } },
    { slug: { contains: q, mode: "insensitive" } },
  ];
  if (lowStockOnly)         where.stock = { lt: 5 };
  if (user.role !== "ADMIN") where.createdById = user.id;

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true, email: true } }, images: { take: 1, orderBy: { sort: "asc" } } },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Products</h1>
        <Link href="/admin/products/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-eco-green text-white text-sm">
          <i className="fa-solid fa-plus" /> Add product
        </Link>
      </div>

      <form className="mb-5">
        <div className="relative max-w-sm">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input name="q" defaultValue={q} placeholder="Search by name or slug..." className="eco-input pl-10" />
        </div>
        {lowStockOnly && (
          <Link href="/admin/products" className="text-xs text-eco-green mt-2 inline-block">
            Showing low-stock only — clear filter
          </Link>
        )}
      </form>

      {products.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-10 text-center text-gray-500">
          {q ? "No products match that search." : "No products yet."}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="text-left px-4 py-3">Image</th>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Price</th>
                <th className="text-left px-4 py-3">Stock</th>
                <th className="text-left px-4 py-3">Added by</th>
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
                    <Link href={`/admin/products/${p.id}/edit`} className="font-medium hover:text-eco-green">{p.name}</Link>
                    <div className="text-xs text-gray-500">/{p.slug}</div>
                  </td>
                  <td className="px-4 py-3">${Number(p.price).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={p.stock < 5 ? "text-amber-600 font-semibold" : p.stock === 0 ? "text-red-500 font-semibold" : ""}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.createdBy?.name || p.createdBy?.email}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/products/${p.id}/edit`} className="text-eco-green hover:underline text-sm">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
