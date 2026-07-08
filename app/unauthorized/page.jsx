// app/unauthorized/page.jsx
// Shown when:
//   - An anonymous user hits any /dashboard/* route (middleware bounce).
//   - A signed-in user lacks the role required by a /dashboard sub-page
//     (requireRole() bounce from lib/auth-helpers.js).

import Link from "next/link";

export const metadata = { title: "Unauthorized — Ecobazar" };

export default async function UnauthorizedPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const next = typeof sp.next === "string" && sp.next.startsWith("/") ? sp.next : "/dashboard";
  const loginHref = `/login?next=${encodeURIComponent(next)}`;

  return (
    <section className="max-w-[1320px] mx-auto px-4 sm:px-6 py-12 sm:py-20 min-h-[60vh] grid place-items-center">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-eco-green/10 text-eco-green grid place-items-center mb-5">
          <i className="fa-solid fa-lock text-3xl sm:text-4xl" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-eco-dark mb-2">
          You&apos;re not authorized to view this page.
        </h1>
        <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8">
          Please log in to continue.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={loginHref}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-eco-green text-white font-medium hover:bg-emerald-600 min-h-[44px]"
          >
            Log in <i className="fa-solid fa-arrow-right text-xs" />
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-gray-200 text-gray-700 hover:border-eco-green hover:text-eco-green min-h-[44px]"
          >
            Create an account
          </Link>
        </div>

        <Link href="/" className="block mt-8 text-sm text-gray-500 hover:text-eco-green">
          ← Back to home
        </Link>
      </div>
    </section>
  );
}
