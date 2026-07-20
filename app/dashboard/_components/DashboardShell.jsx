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
import { useT } from "../../../lib/i18n/LanguageProvider";

const RANK = { CUSTOMER: 0, MODERATOR: 1, ADMIN: 2 };

// Nav is grouped into sections so sales work (orders) and catalog work
// (products, reviews) don't sit interleaved in one flat list. Each item still
// declares the minimum role required to see it; a section whose items are all
// filtered out renders nothing at all, heading included.
//
// `titleKey: null` = no heading, used for the single top-level Overview link.
// Settings stays in the last section so it lands directly above the
// signed-in-as footer block.
const NAV_SECTIONS = [
  {
    titleKey: null,
    items: [
      { href: "/dashboard", labelKey: "dashboard.overview", icon: "fa-gauge-high", min: "CUSTOMER" },
    ],
  },
  {
    titleKey: "dashboard.navOrders",
    items: [
      { href: "/dashboard/orders", labelKey: "dashboard.orders", icon: "fa-receipt", min: "CUSTOMER" },
    ],
  },
  {
    titleKey: "dashboard.navCatalog",
    items: [
      { href: "/dashboard/products", labelKey: "dashboard.products", icon: "fa-boxes-stacked", min: "MODERATOR" },
      { href: "/dashboard/reviews",  labelKey: "dashboard.reviews",  icon: "fa-comment-dots",  min: "MODERATOR" },
    ],
  },
  {
    titleKey: "dashboard.navAdmin",
    items: [
      { href: "/dashboard/users",            labelKey: "dashboard.users",    icon: "fa-users",          min: "ADMIN" },
      { href: "/dashboard/profile-requests", labelKey: "requests.navLabel",  icon: "fa-user-pen",       min: "MODERATOR" },
      { href: "/dashboard/audit-log",        labelKey: "dashboard.auditLog", icon: "fa-clipboard-list", min: "ADMIN" },
    ],
  },
  {
    titleKey: "dashboard.navAccount",
    items: [
      { href: "/dashboard/settings", labelKey: "dashboard.settings", icon: "fa-sliders", min: "CUSTOMER" },
    ],
  },
];

export default function DashboardShell({ user, children }) {
  const t = useT();
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

  // Filter items by role first, then drop any section left empty — otherwise a
  // CUSTOMER would see a bare "Catalog" heading with nothing under it.
  const sections = NAV_SECTIONS
    .map((s) => ({ ...s, items: s.items.filter((n) => RANK[user.role] >= RANK[n.min]) }))
    .filter((s) => s.items.length > 0);

  const Sidebar = (
    <>
      <Link href="/dashboard" className="flex items-center gap-2 px-5 py-5 border-b border-white/10">
        <i className="fa-solid fa-seedling text-eco-green text-2xl sm:text-3xl" />
        <span className="text-lg sm:text-xl font-bold text-white">{t("dashboard.brand")}</span>
        <span className="ml-auto text-[10px] uppercase tracking-wider bg-eco-green text-white px-2 py-0.5 rounded">{user.role}</span>
      </Link>
      <nav className="flex-1 py-2 overflow-y-auto">
        {sections.map((section, i) => (
          <div key={section.titleKey || "root"} className={i > 0 ? "mt-1 pt-2 border-t border-white/10" : ""}>
            {section.titleKey && (
              <div className="px-5 pt-2 pb-1 text-[10px] uppercase tracking-wider text-gray-500">
                {t(section.titleKey)}
              </div>
            )}
            {section.items.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 px-5 py-3 text-sm transition min-h-[44px] ${
                  isActive(n.href) ? "bg-eco-green text-white" : "text-gray-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <i className={`fa-solid ${n.icon} w-4`} />
                {t(n.labelKey)}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4 text-gray-300">
        <div className="text-xs text-gray-400">{t("dashboard.signedInAs")}</div>
        <div className="font-medium text-white truncate">{user.name || user.email}</div>
        <div className="text-xs text-eco-green mt-0.5">{user.role}</div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-3 w-full py-2 text-sm border border-white/15 rounded hover:bg-white/5 min-h-[44px]"
        >
          <i className="fa-solid fa-arrow-right-from-bracket mr-2" /> {t("dashboard.signOut")}
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
            aria-label={t("dashboard.openMenu")}
          >
            <i className="fa-solid fa-bars text-xl" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <i className="fa-solid fa-seedling text-eco-green text-xl" />
            <span className="font-bold">{t("dashboard.dashboard")}</span>
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-11 h-11 grid place-items-center -mr-2"
            aria-label={t("dashboard.signOut")}
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
