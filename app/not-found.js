// app/not-found.js — Next.js App Router 404 page.
// Renders automatically whenever a route doesn't match. The root layout
// (TopBar, Header, Nav, Newsletter, Footer) still wraps this content, so we
// only need to render the middle section here.

import Image from "next/image";
import Link from "next/link";
import Breadcrumb from "../components/Breadcrumb";

export const metadata = {
  title: "Page not found — Ecobazar",
  description: "We couldn't find the page you were looking for.",
};

export default function NotFound() {
  return (
    <>
      <Breadcrumb items={[{ label: "404 Error Page" }]} />

      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
        <div className="relative mx-auto w-full max-w-[550px] aspect-[550/400]">
          <Image
            src="/images/404-illustration.png"
            alt="Confused shopper next to a giant 404"
            fill
            priority
            sizes="(min-width: 640px) 550px, 90vw"
            className="object-contain"
          />
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-6 sm:mt-8">
          Oops! page not found
        </h1>
        <p className="text-gray-500 text-sm sm:text-base mt-3 sm:mt-4 max-w-xl mx-auto">
          We couldn&apos;t find the page you were looking for. It may have been
          renamed or moved.
        </p>

        <div className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 rounded-full bg-eco-green text-white font-medium hover:bg-emerald-600 transition"
          >
            <i className="fa-solid fa-arrow-left mr-2" />
            Back to Home
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center px-6 py-3 rounded-full border border-gray-200 text-gray-700 hover:border-eco-green hover:text-eco-green font-medium transition"
          >
            Browse the shop
            <i className="fa-solid fa-arrow-right ml-2" />
          </Link>
        </div>
      </section>
    </>
  );
}
