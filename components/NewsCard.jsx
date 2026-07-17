// components/NewsCard.jsx — blog card on the Home "Latest News" section.
import Image from "next/image";
import Link from "next/link";
import { getT } from "../lib/i18n/server";

export default async function NewsCard({ image, date, title }) {
  const { t } = await getT();
  return (
    <article className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm">
      <div className="relative h-56 w-full">
        <Image src={image} alt="" fill className="object-cover" sizes="(min-width:768px) 33vw, 100vw" />
        <div className="absolute bottom-3 left-3 bg-white rounded-md px-3 py-1 text-center shadow">
          <div className="text-sm font-bold leading-none">{date.d}</div>
          <div className="text-[10px] text-gray-500">{date.m}</div>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <span><i className="fa-solid fa-tag mr-1" /> {t("news.category")}</span>
          <span><i className="fa-regular fa-user mr-1" /> {t("news.author")}</span>
          <span><i className="fa-regular fa-comment mr-1" /> {t("news.comments")}</span>
        </div>
        <Link href="/blog/post" className="block font-semibold text-eco-dark hover:text-eco-green mb-4">{title}</Link>
        <Link href="/blog/post" className="text-eco-green text-sm font-medium">{t("news.readMore")} <i className="fa-solid fa-arrow-right text-xs" /></Link>
      </div>
    </article>
  );
}
