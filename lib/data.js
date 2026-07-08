// lib/data.js — sample data for the storefront. Replace with a real CMS / DB later.

export const categories = [
  { slug: "fresh-fruit",      name: "Fresh Fruit",       icon: "🍍" },
  { slug: "fresh-vegetables", name: "Fresh Vegetables",  icon: "🥦", active: true },
  { slug: "meat-fish",        name: "Meat & Fish",       icon: "🍖" },
  { slug: "snacks",           name: "Snacks",            icon: "🍪" },
  { slug: "beverages",        name: "Beverages",         icon: "🥤" },
  { slug: "beauty-health",    name: "Beauty & Health",   icon: "🧴" },
  { slug: "bread-bakery",     name: "Bread & Bakery",    icon: "🥖" },
  { slug: "baking-needs",     name: "Baking Needs",      icon: "🥚" },
  { slug: "cooking",          name: "Cooking",           icon: "🍳" },
  { slug: "diabetic-food",    name: "Diabetic Food",     icon: "🥗" },
  { slug: "dish-detergents",  name: "Dish Detergents",   icon: "🧼" },
  { slug: "oil",              name: "Oil",               icon: "🛢️" },
];

// ---------------------------------------------------------------------------
// Product image "views"
//
// Each product carries an array of view descriptors used by the
// ProductGallery component. Two shapes are supported:
//
//   { type: "image", src: "/images/products/apple-1.jpg", label: "Front" }
//   { type: "view",  emoji: "🍏", bg: "linear-gradient(...)", scale: 1, label: "..." }
//
// The "view" shape is a styled-card placeholder so the gallery + zoom works
// before real product photography is dropped in. To swap in real photos:
// just put files under public/images/products/ and replace the array.
// ---------------------------------------------------------------------------

const VIEW_PRESETS = (emoji) => ([
  { type: "view", emoji, bg: "radial-gradient(circle at 50% 40%, #ffffff 0%, #f4f7f4 70%)", scale: 1.0,  label: "Front" },
  { type: "view", emoji: emoji + emoji,         bg: "linear-gradient(135deg, #eef7ee 0%, #ffffff 100%)", scale: 0.65, label: "2-pack" },
  { type: "view", emoji,                        bg: "radial-gradient(circle at 50% 50%, #ffffff 0%, #e8f5e9 80%)", scale: 1.55, label: "Close-up" },
  { type: "view", emoji: emoji.repeat(4),       bg: "linear-gradient(135deg, #ffffff 0%, #f0f4f1 100%)", scale: 0.42, label: "1 kg / 4-pack" },
  { type: "view", emoji,                        bg: "radial-gradient(circle at 30% 60%, #d6efe0 0%, #ffffff 80%)", scale: 1.1, rotate: -8, label: "Angled" },
  { type: "view", emoji,                        bg: "linear-gradient(180deg, #003c1f 0%, #002603 100%)", scale: 1.05, dark: true, label: "Studio dark" },
]);

export const products = [
  { slug: "green-apple",        name: "Green Apple",         icon: "🍏", price: 14.99, oldPrice: 20.99, badge: "Sale 50%", rating: 4, images: VIEW_PRESETS("🍏") },
  { slug: "fresh-indian-malta", name: "Fresh Indian Malta",  icon: "🍊", price: 20.00, rating: 4, images: VIEW_PRESETS("🍊") },
  { slug: "chinese-cabbage",    name: "Chinese cabbage",     icon: "🥬", price: 12.00, rating: 4, featured: true, images: VIEW_PRESETS("🥬") },
  { slug: "green-lettuce",      name: "Green Lettuce",       icon: "🥗", price: 9.00,  rating: 4, images: VIEW_PRESETS("🥗") },
  { slug: "eggplant",           name: "Eggplant",            icon: "🍆", price: 34.00, rating: 4, images: VIEW_PRESETS("🍆") },
  { slug: "big-potatoes",       name: "Big Potatoes",        icon: "🥔", price: 20.00, rating: 4, images: VIEW_PRESETS("🥔") },
  { slug: "corn",               name: "Corn",                icon: "🌽", price: 20.00, rating: 4, images: VIEW_PRESETS("🌽") },
  { slug: "fresh-cauliflower",  name: "Fresh Cauliflower",   icon: "🥦", price: 12.00, rating: 4, images: VIEW_PRESETS("🥦") },
  { slug: "green-capsicum",     name: "Green Capsicum",      icon: "🫑", price: 9.00,  oldPrice: 20.99, badge: "Sale 50%", rating: 4, images: VIEW_PRESETS("🫑") },
  { slug: "green-chili",        name: "Green Chili",         icon: "🌶️", price: 34.00, rating: 4, images: VIEW_PRESETS("🌶️") },
];

export const news = [
  { id: 1, image: "/images/news1.jpg", date: { d: "18", m: "NOV" }, title: "Curabitur porttitor orci eget neque accumsan venenatis. Nunc fermentum." },
  { id: 2, image: "/images/news2.jpg", date: { d: "29", m: "JAN" }, title: "Eget lobortis lorem lacinia. Vivamus pharetra semper," },
  { id: 3, image: "/images/news3.jpg", date: { d: "21", m: "FEB" }, title: "Maecenas blandit risus elementum mauris malesuada." },
];

export const testimonials = [
  { id: 1, name: "Robert Fox",     role: "Customer", avatar: "👨" },
  { id: 2, name: "Dianne Russell", role: "Customer", avatar: "👩" },
  { id: 3, name: "Eleanor Pena",   role: "Customer", avatar: "👨‍🦱" },
];

export const instagramTiles = [
  "/images/ig1.jpg", "/images/ig2.jpg", "/images/ig3.jpg",
  "/images/ig4.jpg", "/images/ig5.jpg", "/images/ig6.jpg",
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

// Returns the matching product or null. Replaces the previous silent fallback
// (which used to default to chinese-cabbage on any unknown slug — confusing).
export function findProductBySlug(slug) {
  return products.find((p) => p.slug === slug) || null;
}

// Pure JS Levenshtein. Used to suggest the closest real product when a user
// hits /shop/<garbage>.
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  // Single-row DP — O(min(m,n)) memory.
  const prev = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    let last = prev[0];
    prev[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = prev[j];
      prev[j] = a[i - 1] === b[j - 1]
        ? last
        : 1 + Math.min(last, prev[j], prev[j - 1]);
      last = tmp;
    }
  }
  return prev[n];
}

// Normalised similarity in [0..1]. 1 = identical, 0 = nothing in common.
function similarity(a, b) {
  if (!a || !b) return 0;
  if (a === b)  return 1;
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}

// Best similarity between the query and any of: full slug, the product name
// with spaces -> dashes, and each individual token (≥ 3 chars) of the slug.
// This handles typos AND missing/extra parts ("cabage" → "chinese-cabbage"
// via the "cabbage" token, "grenapl" → "green-apple" via full slug).
function bestSimilarity(query, product) {
  const q = query.toLowerCase();
  const nameSlug = product.name.toLowerCase().replace(/\s+/g, "-");
  let best = Math.max(similarity(q, product.slug), similarity(q, nameSlug));

  for (const tok of product.slug.split("-")) {
    if (tok.length >= 3) best = Math.max(best, similarity(q, tok));
  }
  return best;
}

// Returns the top `n` products sorted by similarity to the query slug.
// Each entry is `{ product, similarity }` so callers can decide whether to
// show a suggestion or not (see `isGoodSuggestion` below).
export function findNearestProducts(slug, n = 4) {
  const q = String(slug || "").toLowerCase();
  const scored = products.map((p) => ({ product: p, similarity: bestSimilarity(q, p) }));
  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, n);
}

// A suggestion is worth showing only when it crosses a similarity threshold
// — otherwise we'd be making confident "did you mean apple?" claims to a
// user who typed random characters.
export function isGoodSuggestion(_query, suggestion) {
  return Boolean(suggestion && suggestion.similarity >= 0.6);
}
