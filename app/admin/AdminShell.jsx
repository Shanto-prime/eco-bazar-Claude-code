"use client";

// components used inside /admin only — sidebar + top bar with sign-out.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV = [
  { href: "/admin",          label: "Dashboard",    icon: "fa-gauge-high", role: "MODERATOR" },
  { href: "/admin/products", label: "Products",     icon: "fa-boxes-stacked", role: "MODERATOR" },
  { href: "/admin/orders",   label: "Orders",       icon: "fa-receipt", role: "MODERATOR" },
  { href: "/admin/reviews",  label: "Reviews",      icon: "fa-comment-dots", role: "MODERATOR" },
  { href: "/admin/users",    label: "Users",        icon: "fa-users", role: "ADMIN" },
  { href: "/admin/audit",    label: "Audit log",    icon: "fa-clipboard-list", role: "ADMIN" },
];

const RANK = { CUSTOMER: 0, MODERATOR: 1, ADMIN: 2 };

export default function AdminShell({ user, children }) {
  const pathname = usePathname();
  const isActive = (h) => pathname === h || (h !== "/admin" && pathname.startsWith(h));

  return (
    <div className="min-h-screen bg-eco-bg flex">
      {/* Sidebar */}
      <aside className="w-64 bg-eco-footer text-gray-300 flex flex-col hidden md:flex">
        <Link href="/admin" className="flex items-center gap-2 px-5 py-5 border-b border-white/10">
          <i className="fa-solid fa-seedling text-eco-green text-3xl" />
          <span className="text-xl font-bold text-white">Ecobazar</span>
          <span className="ml-auto text-xs uppercase tracking-wider bg-eco-green text-white px-2 py-0.5 rounded">Admin</span>
        </Link>
        <nav className="flex-1 py-2">
          {NAV.filter((n) => RANK[user.role] >= RANK[n.role]).map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 px-5 py-3 text-sm transition ${
                isActive(n.href) ? "bg-eco-green text-white" : "hover:bg-white/5 hover:text-white"
              }`}
            >
              <i className={`fa-solid ${n.icon} w-4`} />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="text-xs text-gray-400">Signed in as</div>
          <div className="font-medium text-white truncate">{user.name || user.email}</div>
          <div className="text-xs text-eco-green mt-0.5">{user.role}</div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="mt-3 w-full py-2 text-sm border border-white/15 rounded hover:bg-white/5"
          >
            <i className="fa-solid fa-arrow-right-from-bracket mr-2" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-eco-footer text-white z-10 flex items-center justify-between px-4 py-3">
        <Link href="/admin" className="flex items-center gap-2">
          <i className="fa-solid fa-seedling text-eco-green text-2xl" />
          <span className="font-bold">Ecobazar Admin</span>
        </Link>
        <button type="button" onClick={() => signOut({ callbackUrl: "/admin/login" })} className="text-sm">
          <i className="fa-solid fa-arrow-right-from-bracket" /> Sign out
        </button>
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 mt-14 md:mt-0 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
