// app/403/page.js — Forbidden page. Shown when a signed-in user lacks the
// role for a /admin route.

import Link from "next/link";

export const metadata = { title: "Forbidden — Ecobazar" };

export default function Forbidden() {
  return (
    <section className="max-w-[1320px] mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
      <div className="text-6xl sm:text-7xl mb-4">🚫</div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">Access denied</h1>
      <p className="text-gray-500 mb-6">
        Your account doesn&apos;t have permission to view this page. If you
        believe this is a mistake, contact an administrator.
      </p>
      <Link href="/" className="inline-block px-6 py-3 rounded-full bg-eco-green text-white font-medium">
        Back to home
      </Link>
    </section>
  );
}
