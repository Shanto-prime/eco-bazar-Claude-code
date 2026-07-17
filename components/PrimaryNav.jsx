"use client";

// components/PrimaryNav.jsx — main navigation bar.
// Desktop: horizontal links. Mobile: hamburger drawer.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useT } from "../lib/i18n/LanguageProvider";

const ITEMS = [
  { href: "/",         key: "nav.home",    hasChildren: false },
  { href: "/shop",     key: "nav.shop",    hasChildren: true  },
  { href: "/pages",    key: "nav.pages",   hasChildren: true  },
  { href: "/blog",     key: "nav.blog",    hasChildren: true  },
  { href: "/about",    key: "nav.about",   hasChildren: false },
  { href: "/contact",  key: "nav.contact", hasChildren: false },
];

export default function PrimaryNav() {
  const pathname = usePathname();
  const t = useT();
  const [open, setOpen] = useState(false);

  // Close on route change.
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll when drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const isActive = (href) => pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <nav style={{ background: "#1a2424" }} className="relative">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Hamburger (mobile) ----------------------------------------------- */}
        <button
          type="button" onClick={() => setOpen(true)}
          className="lg:hidden text-white py-4 flex items-center gap-2"
          aria-label={t("nav.openMenu")}
        >
          <i className="fa-solid fa-bars text-lg" />
          <span className="font-medium">{t("nav.menu")}</span>
        </button>

        {/* Desktop links ---------------------------------------------------- */}
        <ul className="hidden lg:flex text-white">
          {ITEMS.map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                className={`block px-5 py-4 hover:text-eco-green ${isActive(it.href) ? "text-eco-green font-medium" : ""}`}
              >
                {t(it.key)}
                {it.hasChildren && <i className="fa-solid fa-chevron-down text-[10px] ml-1" />}
              </Link>
            </li>
          ))}
        </ul>

        <div className="text-white flex items-center gap-2 text-sm sm:text-base">
          <i className="fa-solid fa-phone text-eco-green" />
          <a href="tel:2195550114" className="font-semibold">(219) 555-0114</a>
        </div>
      </div>

      {/* Mobile drawer ----------------------------------------------------- */}
      {open && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setOpen(false)} />
          <aside
            className="fixed top-0 left-0 bottom-0 w-72 max-w-[85vw] bg-white z-50 lg:hidden flex flex-col animate-[slideInLeft_.2s_ease-out]"
            role="dialog" aria-label={t("nav.siteMenu")}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
                <i className="fa-solid fa-seedling text-eco-green text-2xl" />
                <span className="text-xl font-bold text-eco-dark">Ecobazar</span>
              </Link>
              <button type="button" onClick={() => setOpen(false)} aria-label={t("nav.closeMenu")} className="w-9 h-9 grid place-items-center">
                <i className="fa-solid fa-xmark text-xl" />
              </button>
            </div>

            <ul className="flex-1 overflow-y-auto py-2">
              {ITEMS.map((it) => (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    className={`block px-5 py-3 border-b border-gray-100 ${
                      isActive(it.href) ? "text-eco-green font-medium bg-eco-bg" : "text-gray-700"
                    }`}
                  >
                    {t(it.key)}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/cart"     className="block px-5 py-3 border-b border-gray-100 text-gray-700"><i className="fa-solid fa-bag-shopping mr-2 text-eco-green" /> {t("nav.cart")}</Link>
              </li>
              <li>
                <Link href="/wishlist" className="block px-5 py-3 border-b border-gray-100 text-gray-700"><i className="fa-regular fa-heart mr-2 text-eco-green" /> {t("nav.wishlist")}</Link>
              </li>
              <li>
                <Link href="/login"     className="block px-5 py-3 border-b border-gray-100 text-gray-700"><i className="fa-regular fa-user mr-2 text-eco-green" /> {t("topbar.login")}</Link>
              </li>
              <li>
                <Link href="/dashboard" className="block px-5 py-3 border-b border-gray-100 text-gray-700"><i className="fa-solid fa-gauge-high mr-2 text-eco-green" /> {t("topbar.dashboard")}</Link>
              </li>
            </ul>

            <div className="border-t px-5 py-4 text-sm text-gray-500">
              <div><i className="fa-solid fa-phone text-eco-green mr-2" /> (219) 555-0114</div>
              <div className="mt-1"><i className="fa-solid fa-envelope text-eco-green mr-2" /> Proxy@gmail.com</div>
            </div>
          </aside>
        </>
      )}
    </nav>
  );
}
