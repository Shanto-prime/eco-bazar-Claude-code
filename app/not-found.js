// app/not-found.js — Next.js App Router 404 page.
// Renders automatically whenever a route doesn't match. The root layout
// (TopBar, Header, Nav, Newsletter, Footer) still wraps this content, so we
// only need to render the middle section here.

import Image from "next/image";
import Link from "next/link";
import Breadcrumb from "../components/Breadcrumb";
import { getT } from "../lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getT();
  return {
    title: t("meta.notFoundTitle"),
    description: t("meta.notFoundDesc"),
  };
}

export default async function NotFound() {
  const { t } = await getT();
  return (
    <>
      <Breadcrumb items={[{ label: t("notFound.breadcrumb") }]} />

      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
        <div className="relative mx-auto w-full max-w-[550px] aspect-[550/400]">
          <Image
            src="/images/404-illustration.png"
            alt={t("notFound.imageAlt")}
            fill
            priority
            sizes="(min-width: 640px) 550px, 90vw"
            className="object-contain"
          />
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-6 sm:mt-8">
          {t("notFound.heading")}
        </h1>
        <p className="text-gray-500 text-sm sm:text-base mt-3 sm:mt-4 max-w-xl mx-auto">
          {t("notFound.body")}
        </p>

        <div className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 rounded-full bg-eco-green text-white font-medium hover:bg-emerald-600 transition"
          >
            <i className="fa-solid fa-arrow-left mr-2" />
            {t("notFound.backHome")}
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center px-6 py-3 rounded-full border border-gray-200 text-gray-700 hover:border-eco-green hover:text-eco-green font-medium transition"
          >
            {t("notFound.browseShop")}
            <i className="fa-solid fa-arrow-right ml-2" />
          </Link>
        </div>
      </section>
    </>
  );
}
