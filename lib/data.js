// lib/data.js — non-catalogue storefront placeholders.
//
// The product catalogue is DB-backed (see lib/products-db.js and prisma/seed.js
// / prisma/seed-data.js) — this file no longer defines products. It only holds
// the static bits the homepage still uses as decoration: the category tiles,
// the news carousel, the testimonials strip, and the Instagram grid.

export const categories = [
  { slug: "fresh-fruit",      name: "Fresh Fruit",       icon: "🍍", image: "/images/cat1.jpg" },
  { slug: "fresh-vegetables", name: "Fresh Vegetables",  icon: "🥦", image: "/images/cat2.jpg" },
  { slug: "meat-fish",        name: "Meat & Fish",       icon: "🍖", image: "/images/cat3.jpg" },
  { slug: "snacks",           name: "Snacks",            icon: "🍪", image: "/images/cat4.jpg" },
  { slug: "beverages",        name: "Beverages",         icon: "🥤", image: "/images/cat5.jpg" },
  { slug: "beauty-health",    name: "Beauty & Health",   icon: "🧴", image: "/images/cat6.jpg" },
  { slug: "bread-bakery",     name: "Bread & Bakery",    icon: "🥖", image: "/images/cat7.jpg" },
  { slug: "baking-needs",     name: "Baking Needs",      icon: "🥚", image: "/images/cat8.jpg" },
  { slug: "cooking",          name: "Cooking",           icon: "🍳", image: "/images/cat9.jpg" },
  { slug: "diabetic-food",    name: "Diabetic Food",     icon: "🥗", image: "/images/cat10.jpg" },
  { slug: "dish-detergents",  name: "Dish Detergents",   icon: "🧼", image: "/images/cat11.jpg" },
  { slug: "oil",              name: "Oil",               icon: "🛢️", image: "/images/cat12.jpg" },
];

export const news = [
  { id: 1, image: "/images/news1.jpg", date: { d: "18", m: "NOV" }, title: "Curabitur porttitor orci eget neque accumsan venenatis. Nunc fermentum." },
  { id: 2, image: "/images/news2.jpg", date: { d: "29", m: "JAN" }, title: "Eget lobortis lorem lacinia. Vivamus pharetra semper," },
  { id: 3, image: "/images/news3.jpg", date: { d: "21", m: "FEB" }, title: "Maecenas blandit risus elementum mauris malesuada." },
];

export const testimonials = [
  { id: 1, name: "Robert Fox",     role: "Customer", avatar: "👨",    avatarImg: "/images/avatar1.jpg" },
  { id: 2, name: "Dianne Russell", role: "Customer", avatar: "👩",    avatarImg: "/images/avatar2.jpg" },
  { id: 3, name: "Eleanor Pena",   role: "Customer", avatar: "👨‍🦱", avatarImg: "/images/avatar3.jpg" },
];

export const instagramTiles = [
  "/images/ig1.jpg", "/images/ig2.jpg", "/images/ig3.jpg",
  "/images/ig4.jpg", "/images/ig5.jpg", "/images/ig6.jpg",
];
