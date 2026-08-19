# Product image prompts — one-time Gemini generation list

TEMPORARY FILE — delete this when all 59 product images have been generated
and uploaded through /dashboard/products (or written into ProductImage.url
directly).

## How to use

1. Paste the MASTER PROMPT below into Gemini once.
2. For each product line below, replace the `{{PRODUCT}}` placeholder in the
   master prompt with the italicised description on that product's line.
3. Save the result as `<slug>.jpg` at 800×800 (or 1024×1024, then resize).
4. Upload from `/dashboard/products` (edit each product, replace its image).

Lines are grouped by category and marked with the product slug so you can
match them back to `prisma/seed-data.js` if names ever change. The eggplant
(`begun`) line is included for reference — mark it done since you already
generated it.

---

## MASTER PROMPT (paste into Gemini first, then swap `{{PRODUCT}}` per row)

```
Professional e-commerce product photograph of {{PRODUCT}}.

STYLE
Clean studio product photography for an online organic grocery storefront.
Shot on a pure white seamless background (#FFFFFF), no gradient. Soft, even,
diffused daylight coming from the upper-left, with one very subtle contact
shadow directly beneath the product to ground it. Colours true-to-life,
slightly saturated for appetite appeal — never neon.

CAMERA
Straight-on, eye-level angle. Medium shot. Sharp focus edge-to-edge. Natural
depth of field, not overly blurred background. Photorealistic. High detail
on textures — skin of the fruit, grain of the rice, weave of the packaging.

FRAMING
Square 1:1 aspect ratio, 1024×1024. The product occupies about 70% of the
frame and is perfectly centred, with even breathing room on all four sides.
Whole product visible — nothing cropped by the edge.

STRICT EXCLUSIONS (must not appear)
- No text, letters, numbers, prices, barcodes, watermarks, logos, or captions.
- No hands, arms, faces, people, or body parts.
- No secondary props (napkins, cutting boards, cutlery, plates, garnishes,
  other food, leaves, flowers, chalkboards, ribbons).
- No text on any packaging — labels must be blank or purely graphic patterns.
- No lifestyle setting, no kitchen background, no wood table, no stone slab.
- No borders, frames, vignettes, HDR, cartoons, illustrations, sketches,
  or heavy artistic filters.

Photorealistic, sharp, catalogue-ready.
```

---

## Fresh Fruit (5)

**deshi-apel** — Deshi Apple (1 kg)

>

**kagji-lebu** — Kagji Lebu / Key Lime (1 kg)

>

**kacha-pepe** — Kacha Pepe / Green Papaya (each)

>

**sagar-kola** — Sagar Kola / Cavendish Banana (dozen)

>

**dragon-fruit** — Dragon Fruit (1 kg)

>

---

## Fresh Vegetables (6)

**deshi-aloo** — Deshi Aloo / Local Potato (1 kg)

>

**kacha-morich** — Kacha Morich / Green Chili (250 g)

>

**begun** — Begun / Long Eggplant (1 kg) ✓ already generated

>

**fulkopi** — Fulkopi / Cauliflower (each)

> **lal-shak** — Lal Shak / Red Amaranth (500 g)

>

**misti-kumra** — Misti Kumra / Sweet Pumpkin (1 kg)

>

---

## Meat & Fish (5)

**deshi-murgi** — Deshi Murgi / Local Chicken (whole, ~1.2 kg)

>

**broiler-murgi** — Broiler Chicken (whole, ~1.5 kg)

>

**rui-mach** — Rui Mach / Rohu (1 kg, cut & cleaned)

>

**ilish-mach** — Ilish Mach / Hilsa (700–900 g whole)

>

**khashir-mangsho** — Khashir Mangsho / Mutton (1 kg, mixed cut)

>

---

## Snacks (5)

**chanachur-classic** — Bombay Sweets Chanachur / Classic (300 g)

>

**haldiram-bhujia** — Haldiram Bhujia Sev (200 g)

>

**nimki** — Deshi Nimki (250 g)

>

**chotpoti-mix** — Instant Chotpoti Mix (200 g)

>

**muri-chira-mix** — Muri–Chira Mix (400 g)

>

---

## Beverages (5)

**kazi-royal-tea** — Kazi & Kazi Royal Tea Loose (400 g)

>

**ispahani-mirzapore** — Ispahani Mirzapore Tea (500 g)

>

**pran-mango-juice** — Pran Mango Juice (1 L)

>

**daaber-pani** — Fresh Coconut Water (500 ml)

> a ECO Bazar generic 500ml clear glass bottle of pale-cloudy fresh coconut water, upright, with a plain white metal crown cap and a blank pale-cream front label, organic text or logos of my store

**rooh-afza** — Rooh Afza Sharbat (750 ml)

>

---

## Beauty & Health (5)

**neem-oil** — Cold-Pressed Neem Oil (200 ml)

>

**aloe-vera-gel** — Organic Aloe Vera Gel (200 g)

>

**meswak-toothpaste** — Dabur Meswak Toothpaste (100 g)

>

**amla-powder** — Amla (Amlaki) Powder (200 g)

>

**sundarban-honey** — Sundarban Raw Honey (500 g)

>

---

## Bread & Bakery (4)

**deshi-ruti** — Deshi Ruti / Chapati (10-pack)

>

**paratha-frozen** — Golden Harvest Frozen Paratha (20-pack)

> an ECO Bazar generic 20-pack rectangular cardboard box of frozen layered paratha, standing upright, matte finish, solid pale-blue blank label with with organic text or logos of my store, a very faint frosty condensation on the surface, front view

**kishwan-sliced-bread** — Kishwan Sliced Sandwich Bread (400 g)

> **chawkbazar-bakarkhani** — Chawkbazar Bakarkhani (6-pack)

>

---

## Baking Needs (5)

**teer-ata** — Teer Ata / Whole Wheat Flour (2 kg)

>

**teer-maida** — Teer Maida / Refined Flour (2 kg)

>

**suji** — Suji / Semolina (500 g)

>

**instant-yeast** — Instant Yeast Sachets (10 × 11 g)

> ten small individual 11-gram foil sachets of instant yeast, laid out in a neat 2×5 grid on the white surface, matte silver foil with blank fronts, with organic text or logos of my store

**cocoa-powder** — Pure Cocoa Powder (100 g)

>

---

## Cooking (6)

**chinigura-rice** — Chinigura Aromatic Rice (1 kg)

>

**rupchanda-miniket** — Rupchanda Miniket Rice (5 kg)

> an ECO Bazar generic 5-kilogram clear plastic sack of polished long-grain white Miniket rice (grains clearly visible through the plastic), upright with a stitched top seal, blank front label in solid pale-blue with with organic text or logos of my store, front view

**kalijira-chal** — Kalijira Aromatic Rice (1 kg)

>

**motka-musur-daal** — Motka Musur Daal / Red Lentil (1 kg)

>

**kabuli-chola** — Kabuli Chola / White Chickpea (500 g)

>

**farm-eggs** — Farm Fresh Eggs (12-pack)

>

---

## Diabetic Food (4)

**quaker-oats** — Quaker Rolled Oats (500 g)

>

**job-barley** — Job Barley (500 g)

>

**chia-seeds** — Organic Chia Seeds (200 g)

>

**britannia-sugarfree-digestive** — Sugar-Free Digestive Biscuits (200 g)

>

---

## Dish Detergents (4)

**vim-bar** — Vim Dishwash Bar (400 g)

>

**chaka-liquid** — Chaka Dishwashing Liquid (500 ml)

>

**sunlight-bar** — Sunlight Dishwash Bar (250 g)

>

**wheel-powder** — Wheel Detergent Powder (1 kg)

>

---

## Oil (5)

**rupchanda-soybean-5l** — Rupchanda Soybean Oil (5 L)

> a 5-litre tall clear plastic jug of pale-golden soybean oil with an integrated plastic handle, upright, with a plain gold screw cap and a blank pale-yellow front label, organic text or logos of my store

**teer-soybean-2l** — Teer Soybean Oil (2 L)

> a 2-litre tall clear plastic bottle of pale-golden soybean oil, upright, with a plain gold screw cap and a blank pale-yellow front label, organic text or logos of my store

**radhuni-mustard-oil** — Radhuni Mustard Oil (1 L)

> a 1-litre tall clear plastic bottle of dark-amber cold-pressed mustard oil, upright, with a plain black screw cap and a blank deep-yellow front label, organic text or logos of my store

**pran-sunflower** — Pran Sunflower Oil (1 L)

>

**coconut-oil-500ml** — Cold-Pressed Coconut Oil (500 ml)

> a 500ml clear round glass bottle of pale-yellow cold-pressed coconut oil, upright, with a plain white screw cap and a blank cream-coloured front label, organic text or logos of my store
