"use client";

// app/dashboard/_components/DashboardShell.jsx
// Sidebar + top bar shell around every /dashboard/* page.
//   • ≥ md: persistent sidebar on the left.
//   • < md: hidden behind a hamburger that opens a slide-in drawer.
// Body scroll is locked while the mobile drawer is open.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";

const RANK = { CUSTOMER: 0, MODERATOR: 1, ADMIN: 2 };

// Each nav item declares the minimum role required to see it.
const NAV = [
  { href: "/dashboard",            label: "Overview",     icon: "fa-gauge-high",     min: "CUSTOMER" },
  { href: "/dashboard/products",   label: "Products",     icon: "fa-boxes-stacked",  min: "MODERATOR" },
  { href: "/dashboard/orders",     label: "Orders",       icon: "fa-receipt",        min: "CUSTOMER" },
  { href: "/dashboard/reviews",    label: "Reviews",      icon: "fa-comment-dots",   min: "MODERATOR" },
  { href: "/dashboard/users",      label: "Users",        icon: "fa-users",          min: "ADMIN" },
  { href: "/dashboard/audit-log",  label: "Audit log",    icon: "fa-clipboard-list", min: "ADMIN" },
];

export default function DashboardShell({ user, children }) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);

  // Close the drawer on every route change.
  useEffect(() => { setDrawer(false); }, [pathname]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!drawer) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [drawer]);

  const isActive = (h) => pathname === h || (h !== "/dashboard" && pathname.startsWith(h));
  const visible  = NAV.filter((n) => RANK[user.role] >= RANK[n.min]);

  const Sidebar = (
    <>
      <Link href="/dashboard" className="flex items-center gap-2 px-5 py-5 border-b border-white/10">
        <i className="fa-solid fa-seedling text-eco-green text-2xl sm:text-3xl" />
        <span className="text-lg sm:text-xl font-bold text-white">Ecobazar</span>
        <span className="ml-auto text-[10px] uppercase tracking-wider bg-eco-green text-white px-2 py-0.5 rounded">{user.role}</span>
      </Link>
      <nav className="flex-1 py-2 overflow-y-auto">
        {visible.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`flex items-center gap-3 px-5 py-3 text-sm transition min-h-[44px] ${
              isActive(n.href) ? "bg-eco-green text-white" : "text-gray-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <i className={`fa-solid ${n.icon} w-4`} />
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4 text-gray-300">
        <div className="text-xs text-gray-400">Signed in as</div>
        <div className="font-medium text-white truncate">{user.name || user.email}</div>
        <div className="text-xs text-eco-green mt-0.5">{user.role}</div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-3 w-full py-2 text-sm border border-white/15 rounded hover:bg-white/5 min-h-[44px]"
        >
          <i className="fa-solid fa-arrow-right-from-bracket mr-2" /> Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="bg-eco-bg min-h-[calc(100vh-200px)]">
      <div className="max-w-[1440px] mx-auto flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex md:w-60 lg:w-64 bg-eco-footer flex-col sticky top-0 self-start h-screen">
          {Sidebar}
        </aside>

        {/* Mobile top bar (drawer trigger) */}
        <div className="md:hidden fixed top-0 left-0 right-0 bg-eco-footer text-white z-40 flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            className="w-11 h-11 grid place-items-center -ml-2"
            aria-label="Open dashboard menu"
          >
            <i className="fa-solid fa-bars text-xl" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <i className="fa-solid fa-seedling text-eco-green text-xl" />
            <span className="font-bold">Dashboard</span>
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-11 h-11 grid place-items-center -mr-2"
            aria-label="Sign out"
          >
            <i className="fa-solid fa-arrow-right-from-bracket" />
          </button>
        </div>

        {/* Mobile drawer */}
        {drawer && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setDrawer(false)}
              aria-hidden="true"
            />
            <aside className="fixed top-0 left-0 bottom-0 w-72 max-w-[85vw] bg-eco-footer z-50 md:hidden flex flex-col animate-[slideInLeft_.2s_ease-out]">
              {Sidebar}
            </aside>
          </>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 mt-14 md:mt-0 p-4 sm:p-6 lg:p-8 max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
