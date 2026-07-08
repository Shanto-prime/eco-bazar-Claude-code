// components/CategoryTile.jsx — the category card used in the Popular Categories grid.
import Image from "next/image";
import Link from "next/link";

export default function CategoryTile({ slug, name, icon, image, active = false }) {
  return (
    <Link
      href={`/shop?cat=${slug}`}
      className={`cat-tile ${active ? "active" : ""} block border border-gray-200 rounded-md p-5 text-center hover:shadow-md transition`}
    >
      {image ? (
        <div className="relative h-16 mb-3">
          <Image src={image} alt={name} fill className="object-contain" sizes="(min-width:1024px) 16vw, 33vw" />
        </div>
      ) : (
        <div className="text-5xl mb-3">{icon}</div>
      )}
      <div className="font-medium">{name}</div>
    </Link>
  );
}
