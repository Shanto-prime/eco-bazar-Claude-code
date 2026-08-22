// prisma/seed-data.js
// Shared catalogue definition   read by BOTH prisma/seed.js (dev) and
// prisma/seed.prod.js (production). The two seed scripts differ only in
// which users they create; the categories and products come from here.
//
// PRICING
//   All prices are in TAKA. `toCents(taka)` turns them into integer POISHA
//   (1/100 of a Taka), which is how the DB stores money   see lib/money.js
//   and the header of prisma/schema.prisma. Base currency is BDT; nothing
//   converts these numbers at insert time.
//
// BRANDING
//   Every packaged product is EcoBazar own-brand   the seed sets `brand:
//   "EcoBazar"` on anything that ships in wrapping (snacks, tea, oils,
//   flours, cleaning products, etc.). Fresh loose produce and butcher-cut
//   meat/fish have no `brand` because they don't carry one on the shelf.
//   No third-party trademarks appear in slugs, names, or brands anywhere
//   in this file. Slugs are descriptive of the item (e.g. `soybean-oil-5l`,
//   not `rupchanda-soybean-5l`) so the URL and the on-disk image filename
//   both match the storefront's own-brand name.
//
// IMAGES
//   Real product photos live under `public/uploads/products/<slug>.jpeg`,
//   which is the same folder admin uploads through /dashboard/products
//   write to. The seed scripts probe that folder at run time: they attach
//   `<slug>.jpeg` as the primary image, plus any additional shots named
//   `<slug>-2.jpeg`, `<slug>-3.jpeg`, … as extra gallery images (sort
//   order preserved). Slugs without any file get no ProductImage row and
//   the storefront ProductCard falls back to its placeholder.
//
// RATINGS
//   `Product.rating` is populated at seed time by a deterministic formula
//   in the seed scripts (see `ratingFor(slug)`), so the storefront's star
//   filter always has products at each level to hit. The formula is
//   slug-hash based so re-seeding never randomly re-shuffles a product's
//   rating. Any product that sets `rating` explicitly overrides the
//   formula; leave it unset to accept the computed value.

const toCents = (taka) => Math.round(Number(taka) * 100);

// Public URL for a real product photo. Files must exist at
// public/uploads/products/<slug>.jpeg (Next.js serves everything under
// /public at the root). Seed scripts call this only after fs.existsSync
// verifies the file is on disk.
const productImageUrl = (slug) => `/uploads/products/${slug}.jpeg`;

// -----------------------------------------------------------------------------
// Categories   12 storefront categories. Order here becomes display order in
// any UI that iterates this list.
// -----------------------------------------------------------------------------
const CATEGORIES = [
    { slug: "fresh-fruit", name: "Fresh Fruit", icon: "🍍" },
    { slug: "fresh-vegetables", name: "Fresh Vegetables", icon: "🥦" },
    { slug: "meat-fish", name: "Meat & Fish", icon: "🍖" },
    { slug: "snacks", name: "Snacks", icon: "🍪" },
    { slug: "beverages", name: "Beverages", icon: "🥤" },
    { slug: "beauty-health", name: "Beauty & Health", icon: "🧴" },
    { slug: "bread-bakery", name: "Bread & Bakery", icon: "🥖" },
    { slug: "baking-needs", name: "Baking Needs", icon: "🥚" },
    { slug: "cooking", name: "Cooking", icon: "🍳" },
    { slug: "diabetic-food", name: "Diabetic Food", icon: "🥗" },
    { slug: "dish-detergents", name: "Dish Detergents", icon: "🧼" },
    { slug: "oil", name: "Oil", icon: "🛢️" },
];

// -----------------------------------------------------------------------------
// Products   Bangladeshi organic-grocery catalogue, EcoBazar own-brand.
//
// Shape:
//   slug         URL-safe id, unique across the whole catalogue
//   name         Storefront-facing product name (English or transliterated Bangla)
//   category     Category slug (must exist above)
//   price        Selling price in TAKA (major units, not poisha)
//   oldPrice     Optional strike-through original price in TAKA   set alongside
//                a "Sale X%" badge so the discount actually shows on the card
//   badge        Optional short label (e.g. "Sale 20%", "Organic", "New")
//   stock        Starting on-hand quantity
//   brand        Optional brand string   "EcoBazar" for packaged goods, omitted
//                for fresh loose produce and butcher cuts
//   tags         Optional array   used by the promo landing pages and filters
//   description  1–2 short sentences, product-specific
//
// Ratings come from the seed script's `ratingFor(slug)`   a spread from 1.5
// to 5.0 in half-star steps that guarantees the storefront's star filter
// has candidates at every level (5, 4, 3, 2, 1). See RATINGS note above.
// -----------------------------------------------------------------------------
const PRODUCTS = [
    // ------------------------------- Fresh Fruit ------------------------------
    {
        slug: "deshi-apel",
        name: "Deshi Apple (1 kg)",
        category: "fresh-fruit",
        price: 240,
        stock: 60,
        tags: ["fruit", "seasonal"],
        description:
            "Locally grown crisp red apples, hand-picked at peak sweetness.",
    },
    {
        slug: "kagji-lebu",
        name: "Kagji Lebu   Key Lime (1 kg)",
        category: "fresh-fruit",
        price: 80,
        stock: 100,
        tags: ["fruit", "citrus"],
        description:
            "Thin-skinned Kagji limes with a sharp, aromatic juice   the standard for daal, sherbet and marinades.",
    },
    {
        slug: "kacha-pepe",
        name: "Kacha Pepe   Green Papaya (each)",
        category: "fresh-fruit",
        price: 60,
        stock: 80,
        tags: ["fruit", "cooking-vegetable"],
        description:
            "Firm unripe papaya. Grate for salad or slow-cook for shorshe pepe.",
    },
    {
        slug: "sagar-kola",
        name: "Sagar Kola   Cavendish Banana (dozen)",
        category: "fresh-fruit",
        price: 120,
        stock: 150,
        tags: ["fruit", "everyday"],
        description:
            "Sweet dessert bananas   twelve to a bunch, ripened naturally without carbide.",
    },
    {
        slug: "dragon-fruit",
        name: "Dragon Fruit (1 kg)",
        category: "fresh-fruit",
        price: 320,
        stock: 30,
        badge: "New",
        tags: ["fruit", "premium"],
        description:
            "Deshi-grown pink dragon fruit   mildly sweet, high in fibre, and ready to eat chilled.",
    },

    // ---------------------------- Fresh Vegetables ----------------------------
    {
        slug: "deshi-aloo",
        name: "Deshi Aloo   Local Potato (1 kg)",
        category: "fresh-vegetables",
        price: 45,
        stock: 300,
        tags: ["vegetable", "staple"],
        description:
            "Small-to-medium local potatoes with thin skin   the everyday variety for bhaji, torkari and khichuri.",
    },
    {
        slug: "kacha-morich",
        name: "Kacha Morich   Green Chili (250 g)",
        category: "fresh-vegetables",
        price: 55,
        stock: 150,
        tags: ["vegetable", "spice"],
        description:
            "Fresh Bangladeshi green chilies   medium heat, bright grassy aroma.",
    },
    {
        slug: "begun",
        name: "Begun   Long Eggplant (1 kg)",
        category: "fresh-vegetables",
        price: 80,
        stock: 100,
        tags: ["vegetable"],
        description:
            "Slender purple eggplants, few seeds, ideal for begun bhaja and beguni.",
    },
    {
        slug: "fulkopi",
        name: "Fulkopi   Cauliflower (each)",
        category: "fresh-vegetables",
        price: 50,
        stock: 80,
        tags: ["vegetable"],
        description:
            "Tight-headed white cauliflower   trimmed and cleaned before packing.",
    },
    {
        slug: "lal-shak",
        name: "Lal Shak   Red Amaranth (500 g)",
        category: "fresh-vegetables",
        price: 30,
        stock: 120,
        tags: ["vegetable", "leafy"],
        description:
            "Deep-red amaranth greens, tender enough for a quick shak bhaji.",
    },
    {
        slug: "misti-kumra",
        name: "Misti Kumra   Sweet Pumpkin (1 kg)",
        category: "fresh-vegetables",
        price: 60,
        stock: 90,
        tags: ["vegetable"],
        description:
            "Orange-flesh sweet pumpkin   good for kumra bhaji, khichuri and desserts.",
    },

    // -------------------------------- Meat & Fish -----------------------------
    {
        slug: "deshi-murgi",
        name: "Deshi Murgi   Local Chicken (whole, ~1.2 kg)",
        category: "meat-fish",
        price: 480,
        stock: 40,
        tags: ["poultry", "halal"],
        description:
            "Free-range local chicken, hand-slaughtered halal, cleaned and delivered chilled.",
    },
    {
        slug: "broiler-murgi",
        name: "Broiler Chicken (whole, ~1.5 kg)",
        category: "meat-fish",
        price: 320,
        stock: 60,
        tags: ["poultry", "halal"],
        description:
            "Farm-raised broiler chicken   cleaned, ready to portion for curry or biryani.",
    },
    {
        slug: "rui-mach",
        name: "Rui Mach   Rohu (1 kg, cut & cleaned)",
        category: "meat-fish",
        price: 380,
        oldPrice: 460,
        badge: "Sale 17%",
        stock: 50,
        tags: ["fish", "freshwater"],
        description:
            "Fresh Rohu, scaled and cut into curry pieces   the Sunday-lunch fish of every Bangla household.",
    },
    {
        slug: "ilish-mach",
        name: "Ilish Mach   Hilsa (700–900 g whole)",
        category: "meat-fish",
        price: 1400,
        stock: 20,
        badge: "Premium",
        tags: ["fish", "premium", "seasonal"],
        description:
            "Padma-river Hilsa, sourced whole. Marinate with mustard paste for the classic sorshe ilish.",
    },
    {
        slug: "khashir-mangsho",
        name: "Khashir Mangsho   Mutton (1 kg, mixed cut)",
        category: "meat-fish",
        price: 1150,
        stock: 25,
        tags: ["red-meat", "halal"],
        description:
            "Halal mutton in a mixed curry cut   bone-in for maximum flavour.",
    },

    // -------------------------------- Snacks ----------------------------------
    {
        slug: "chanachur-classic",
        name: "EcoBazar Chanachur   Classic (300 g)",
        category: "snacks",
        price: 110,
        stock: 200,
        brand: "EcoBazar",
        tags: ["snack", "spicy"],
        description:
            "Classic Bangladeshi chanachur   crisp gram-flour ribbons, peanuts and lentils in a mild-spicy mix.",
    },
    {
        slug: "bhujia-sev",
        name: "EcoBazar Bhujia Sev (200 g)",
        category: "snacks",
        price: 150,
        stock: 100,
        brand: "EcoBazar",
        tags: ["snack", "spicy"],
        description:
            "Fine gram-flour sev with a warm masala kick. Sprinkle over jhal muri or eat by the handful.",
    },
    {
        slug: "nimki",
        name: "EcoBazar Nimki (250 g)",
        category: "snacks",
        price: 90,
        stock: 120,
        brand: "EcoBazar",
        tags: ["snack", "savoury"],
        description:
            "Flaky diamond-cut savoury pastry, seasoned with kalojira. Freshly fried and packed.",
    },
    {
        slug: "chotpoti-mix",
        name: "EcoBazar Instant Chotpoti Mix (200 g)",
        category: "snacks",
        price: 75,
        stock: 90,
        brand: "EcoBazar",
        tags: ["snack", "kit"],
        description:
            "Everything but the tamarind for a fast street-style chotpoti   spiced boot with a tetul packet included.",
    },
    {
        slug: "muri-chira-mix",
        name: "EcoBazar Muri–Chira Mix (400 g)",
        category: "snacks",
        price: 100,
        stock: 150,
        brand: "EcoBazar",
        tags: ["snack", "everyday"],
        description:
            "Puffed rice and flattened rice mixed with roasted lentils, peanuts and mild masala.",
    },

    // ------------------------------- Beverages --------------------------------
    {
        slug: "royal-loose-tea",
        name: "EcoBazar Royal Loose Tea (400 g)",
        category: "beverages",
        price: 340,
        stock: 80,
        brand: "EcoBazar",
        tags: ["tea", "organic"],
        description:
            "Panchagarh-grown organic loose black tea   full-bodied, malty finish. Steep 4 minutes.",
    },
    {
        slug: "black-tea",
        name: "EcoBazar Black Tea (500 g)",
        category: "beverages",
        price: 290,
        stock: 100,
        brand: "EcoBazar",
        tags: ["tea"],
        description:
            "Everyday brisk black tea   strong and made for milky doodh cha.",
    },
    {
        slug: "mango-juice",
        name: "EcoBazar Mango Juice (1 L)",
        category: "beverages",
        price: 110,
        stock: 200,
        brand: "EcoBazar",
        tags: ["juice", "mango"],
        description: "Sweet, thick mango nectar. Chill hard before pouring.",
    },
    {
        slug: "daaber-pani",
        name: "Fresh Coconut Water (500 ml)",
        category: "beverages",
        price: 90,
        stock: 80,
        brand: "EcoBazar",
        tags: ["fresh", "hydration"],
        description:
            "Bottled the same morning from tender green coconuts. No sugar added, nothing else added.",
    },
    {
        slug: "rose-sharbat",
        name: "EcoBazar Rose Sharbat (750 ml)",
        category: "beverages",
        price: 420,
        stock: 50,
        brand: "EcoBazar",
        tags: ["sharbat", "summer"],
        description:
            "Rose-and-herb sharbat concentrate. Two tablespoons in a glass of cold milk or water.",
    },

    // ---------------------------- Beauty & Health -----------------------------
    {
        slug: "neem-oil",
        name: "Cold-Pressed Neem Oil (200 ml)",
        category: "beauty-health",
        price: 320,
        stock: 60,
        brand: "EcoBazar",
        tags: ["oil", "haircare", "skincare"],
        description:
            "Pure cold-pressed neem oil for scalp massage and skin care. Strong-smelling on purpose   that's the active compound.",
    },
    {
        slug: "aloe-vera-gel",
        name: "Organic Aloe Vera Gel (200 g)",
        category: "beauty-health",
        price: 280,
        stock: 90,
        badge: "Organic",
        brand: "EcoBazar",
        tags: ["skincare", "organic"],
        description:
            "Farm-fresh aloe vera gel with no added colour or fragrance. Refrigerate after opening.",
    },
    {
        slug: "meswak-toothpaste",
        name: "EcoBazar Meswak Herbal Toothpaste (100 g)",
        category: "beauty-health",
        price: 95,
        stock: 150,
        brand: "EcoBazar",
        tags: ["oral-care"],
        description:
            "Herbal toothpaste with meswak (Salvadora persica) extract. Fluoride-free formula.",
    },
    {
        slug: "amla-powder",
        name: "Amla (Amlaki) Powder (200 g)",
        category: "beauty-health",
        price: 240,
        stock: 80,
        brand: "EcoBazar",
        tags: ["haircare", "ayurveda"],
        description:
            "Sun-dried Indian gooseberry powder for hair masks and tonics.",
    },
    {
        slug: "sundarban-honey",
        name: "Sundarban Raw Honey (500 g)",
        category: "beauty-health",
        price: 780,
        stock: 40,
        badge: "Organic",
        brand: "EcoBazar",
        tags: ["honey", "organic", "premium"],
        description:
            "Wild raw honey collected from mangrove-forest hives   unheated, unfiltered, cloudy on purpose.",
    },

    // ----------------------------- Bread & Bakery -----------------------------
    {
        slug: "deshi-ruti",
        name: "EcoBazar Deshi Ruti   Chapati (10-pack)",
        category: "bread-bakery",
        price: 80,
        stock: 100,
        brand: "EcoBazar",
        tags: ["bread", "everyday"],
        description:
            "Whole-wheat chapatis, freshly rolled and packed the same morning. Reheat on a dry tawa.",
    },
    {
        slug: "frozen-paratha",
        name: "EcoBazar Frozen Paratha (20-pack)",
        category: "bread-bakery",
        price: 320,
        stock: 80,
        brand: "EcoBazar",
        tags: ["frozen", "breakfast"],
        description:
            "Layered flaky paratha, individually separated. Straight from freezer to hot pan   no thawing needed.",
    },
    {
        slug: "sliced-sandwich-bread",
        name: "EcoBazar Sliced Sandwich Bread (400 g)",
        category: "bread-bakery",
        price: 75,
        stock: 120,
        brand: "EcoBazar",
        tags: ["bread", "sandwich"],
        description:
            "Soft milk-bread loaf, evenly sliced. Freshness date printed on the tag.",
    },
    {
        slug: "bakarkhani",
        name: "EcoBazar Bakarkhani (6-pack)",
        category: "bread-bakery",
        price: 180,
        stock: 60,
        brand: "EcoBazar",
        tags: ["bread", "traditional"],
        description:
            "Old-Dhaka style layered flatbread, baked hard on the outside and flaky within. Best with cha.",
    },

    // ------------------------------ Baking Needs ------------------------------
    {
        slug: "whole-wheat-flour",
        name: "EcoBazar Whole Wheat Flour   Ata (2 kg)",
        category: "baking-needs",
        price: 140,
        stock: 200,
        brand: "EcoBazar",
        tags: ["flour", "staple"],
        description:
            "Stone-milled whole-wheat flour for roti, paratha and everyday baking.",
    },
    {
        slug: "refined-flour",
        name: "EcoBazar Refined Flour   Maida (2 kg)",
        category: "baking-needs",
        price: 150,
        stock: 200,
        brand: "EcoBazar",
        tags: ["flour", "baking"],
        description:
            "Fine white refined flour for luchi, naan, cakes and pastries.",
    },
    {
        slug: "suji",
        name: "EcoBazar Suji   Semolina (500 g)",
        category: "baking-needs",
        price: 75,
        stock: 150,
        brand: "EcoBazar",
        tags: ["baking", "breakfast"],
        description:
            "Coarse semolina for halwa, upma and crispy snack coatings.",
    },
    {
        slug: "instant-yeast",
        name: "EcoBazar Instant Yeast Sachets (10 × 11 g)",
        category: "baking-needs",
        price: 180,
        stock: 90,
        brand: "EcoBazar",
        tags: ["baking"],
        description:
            "Ten single-use sachets of instant yeast   one sachet raises a standard loaf.",
    },
    {
        slug: "cocoa-powder",
        name: "EcoBazar Pure Cocoa Powder (100 g)",
        category: "baking-needs",
        price: 240,
        stock: 100,
        brand: "EcoBazar",
        tags: ["baking", "dessert"],
        description:
            "Unsweetened cocoa powder for brownies, cakes and hot chocolate.",
    },

    // --------------------------------- Cooking --------------------------------
    {
        slug: "chinigura-rice",
        name: "EcoBazar Chinigura Aromatic Rice (1 kg)",
        category: "cooking",
        price: 180,
        stock: 200,
        brand: "EcoBazar",
        tags: ["rice", "aromatic", "biryani"],
        description:
            "The tiny grain that defines Bangladeshi pulao and biryani   deeply aromatic when steamed.",
    },
    {
        slug: "miniket-rice",
        name: "EcoBazar Miniket Rice (5 kg)",
        category: "cooking",
        price: 480,
        stock: 250,
        brand: "EcoBazar",
        tags: ["rice", "staple"],
        description:
            "Polished miniket for everyday plain rice   light, non-sticky, cooks up fluffy.",
    },
    {
        slug: "kalijira-chal",
        name: "EcoBazar Kalijira Aromatic Rice (1 kg)",
        category: "cooking",
        price: 240,
        stock: 100,
        brand: "EcoBazar",
        tags: ["rice", "aromatic", "premium"],
        description:
            "Premium short-grain aromatic rice   the king of Bangladeshi biryani rice.",
    },
    {
        slug: "motka-musur-daal",
        name: "EcoBazar Motka Musur Daal   Red Lentil (1 kg)",
        category: "cooking",
        price: 140,
        stock: 200,
        brand: "EcoBazar",
        tags: ["daal", "lentil", "staple"],
        description:
            "Split red lentils that cook down soft in fifteen minutes. Everyday daal.",
    },
    {
        slug: "kabuli-chola",
        name: "EcoBazar Kabuli Chola   White Chickpea (500 g)",
        category: "cooking",
        price: 120,
        stock: 150,
        brand: "EcoBazar",
        tags: ["legume", "iftar"],
        description:
            "Plump white chickpeas   soak overnight for chola bhuna, hummus or salad.",
    },
    {
        slug: "farm-eggs",
        name: "EcoBazar Farm Fresh Eggs (12-pack)",
        category: "cooking",
        price: 150,
        stock: 300,
        brand: "EcoBazar",
        tags: ["egg", "staple"],
        description: "Brown farm eggs, cage-free, dated on the carton.",
    },

    // ------------------------------ Diabetic Food -----------------------------
    {
        slug: "rolled-oats",
        name: "EcoBazar Rolled Oats (500 g)",
        category: "diabetic-food",
        price: 240,
        stock: 100,
        brand: "EcoBazar",
        tags: ["breakfast", "diabetic-friendly", "high-fibre"],
        description:
            "Whole rolled oats   low glycaemic, high fibre. Cook in milk or water for five minutes.",
    },
    {
        slug: "job-barley",
        name: "EcoBazar Job Barley (500 g)",
        category: "diabetic-food",
        price: 140,
        stock: 90,
        brand: "EcoBazar",
        tags: ["grain", "diabetic-friendly"],
        description:
            "Pearled barley   a low-GI substitute for white rice in daily meals.",
    },
    {
        slug: "chia-seeds",
        name: "EcoBazar Organic Chia Seeds (200 g)",
        category: "diabetic-food",
        price: 380,
        stock: 60,
        badge: "Organic",
        brand: "EcoBazar",
        tags: ["superfood", "organic", "high-fibre"],
        description:
            "Whole black chia seeds   soak in water or milk for a fibre-rich pudding.",
    },
    {
        slug: "sugarfree-digestive-biscuits",
        name: "EcoBazar Sugar-Free Digestive Biscuits (200 g)",
        category: "diabetic-food",
        price: 140,
        stock: 100,
        brand: "EcoBazar",
        tags: ["biscuit", "diabetic-friendly"],
        description:
            "Whole-wheat digestive biscuits sweetened without sugar. Good with tea.",
    },

    // ----------------------------- Dish Detergents ----------------------------
    {
        slug: "dishwash-bar",
        name: "EcoBazar Dishwash Bar (400 g)",
        category: "dish-detergents",
        price: 75,
        stock: 300,
        brand: "EcoBazar",
        tags: ["cleaning", "kitchen"],
        description:
            "The everyday dishwash bar   cuts grease fast, lasts a long time on a wet scrubber.",
    },
    {
        slug: "dishwashing-liquid",
        name: "EcoBazar Dishwashing Liquid (500 ml)",
        category: "dish-detergents",
        price: 140,
        stock: 150,
        brand: "EcoBazar",
        tags: ["cleaning", "kitchen"],
        description:
            "Concentrated dishwashing liquid with a fresh-lemon scent. Two drops on a wet sponge.",
    },
    {
        slug: "compact-dishwash-bar",
        name: "EcoBazar Compact Dishwash Bar (250 g)",
        category: "dish-detergents",
        price: 55,
        stock: 250,
        brand: "EcoBazar",
        tags: ["cleaning", "kitchen"],
        description:
            "Compact dishwash bar for small kitchens   hard formula, minimal residue.",
    },
    {
        slug: "laundry-detergent-powder",
        name: "EcoBazar Laundry Detergent Powder (1 kg)",
        category: "dish-detergents",
        price: 180,
        stock: 200,
        brand: "EcoBazar",
        tags: ["cleaning", "laundry"],
        description:
            "General-purpose detergent powder for hand-wash and machine-wash laundry.",
    },

    // ---------------------------------- Oil -----------------------------------
    {
        slug: "soybean-oil-5l",
        name: "EcoBazar Soybean Oil (5 L)",
        category: "oil",
        price: 860,
        oldPrice: 950,
        badge: "Sale 10%",
        stock: 150,
        brand: "EcoBazar",
        tags: ["oil", "cooking", "staple"],
        description:
            "The default household cooking oil   refined soybean oil, neutral flavour.",
    },
    {
        slug: "soybean-oil-2l",
        name: "EcoBazar Soybean Oil (2 L)",
        category: "oil",
        price: 360,
        stock: 200,
        brand: "EcoBazar",
        tags: ["oil", "cooking"],
        description:
            "Refined soybean oil in a two-litre bottle   the everyday size.",
    },
    {
        slug: "mustard-oil-1l",
        name: "EcoBazar Mustard Oil (1 L)",
        category: "oil",
        price: 320,
        stock: 100,
        brand: "EcoBazar",
        tags: ["oil", "traditional"],
        description:
            "Cold-pressed mustard oil   the sharp, pungent oil for bhorta, achar and fish.",
    },
    {
        slug: "sunflower-oil-1l",
        name: "EcoBazar Sunflower Oil (1 L)",
        category: "oil",
        price: 320,
        stock: 100,
        brand: "EcoBazar",
        tags: ["oil", "cooking"],
        description:
            "Light refined sunflower oil for everyday frying and sautéing.",
    },
    {
        slug: "coconut-oil-500ml",
        name: "EcoBazar Cold-Pressed Coconut Oil (500 ml)",
        category: "oil",
        price: 360,
        stock: 60,
        brand: "EcoBazar",
        tags: ["oil", "haircare"],
        description:
            "Extra-virgin cold-pressed coconut oil   good for baking, tempering, and hair care.",
    },
];

// Deterministic per-slug rating spread. Buckets are weighted so the storefront
// star filter (radios at 5/4/3/2/1) always has candidates in each bucket, and
// the same slug always resolves to the same rating on every re-seed.
function ratingFor(slug) {
    const buckets = [
        5.0, 4.5, 4.5, 4.0, 4.0, 4.0, 4.0, 3.5, 3.5, 3.5, 3.0, 3.0, 2.5, 2.0,
        1.5,
    ];
    let h = 0;
    for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) | 0;
    return buckets[Math.abs(h) % buckets.length];
}

module.exports = { CATEGORIES, PRODUCTS, toCents, productImageUrl, ratingFor };
