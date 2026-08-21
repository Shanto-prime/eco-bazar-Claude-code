// lib/data.js   non-catalogue storefront placeholders.
//
// The product catalogue is DB-backed (see lib/products-db.js and prisma/seed.js
// / prisma/seed-data.js)   this file no longer defines products. It only holds
// the static bits the homepage still uses as decoration: the category tiles.

export const categories = [
    {
        slug: "fresh-fruit",
        name: "Fresh Fruit",
        icon: "🍍",
        image: "/images/cat1.jpg",
    },
    {
        slug: "fresh-vegetables",
        name: "Fresh Vegetables",
        icon: "🥦",
        image: "/images/cat2.jpg",
    },
    {
        slug: "meat-fish",
        name: "Meat & Fish",
        icon: "🍖",
        image: "/images/cat3.jpg",
    },
    { slug: "snacks", name: "Snacks", icon: "🍪", image: "/images/cat4.jpg" },
    {
        slug: "beverages",
        name: "Beverages",
        icon: "🥤",
        image: "/images/cat5.jpg",
    },
    {
        slug: "beauty-health",
        name: "Beauty & Health",
        icon: "🧴",
        image: "/images/cat6.jpg",
    },
    {
        slug: "bread-bakery",
        name: "Bread & Bakery",
        icon: "🥖",
        image: "/images/cat7.jpg",
    },
    {
        slug: "baking-needs",
        name: "Baking Needs",
        icon: "🥚",
        image: "/images/cat8.jpg",
    },
    { slug: "cooking", name: "Cooking", icon: "🍳", image: "/images/cat9.jpg" },
    {
        slug: "diabetic-food",
        name: "Diabetic Food",
        icon: "🥗",
        image: "/images/cat10.jpg",
    },
    {
        slug: "dish-detergents",
        name: "Dish Detergents",
        icon: "🧼",
        image: "/images/cat11.jpg",
    },
    { slug: "oil", name: "Oil", icon: "🛢️", image: "/images/cat12.jpg" },
];
