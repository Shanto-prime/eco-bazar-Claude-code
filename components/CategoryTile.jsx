// components/CategoryTile.jsx — the category card used in the Popular Categories grid.
import Link from "next/link";

export default function CategoryTile({ slug, name, icon, active = false }) {
  return (
    <Link
      href={`/shop?cat=${slug}`}
      className={`cat-tile ${active ? "active" : ""} block border border-gray-200 rounded-md p-5 text-center hover:shadow-md transition`}
    >
      <div className="text-5xl mb-3">{icon}</div>
      <div className="font-medium">{name}</div>
    </Link>
  );
}
