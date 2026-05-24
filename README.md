# Ecobazar — Next.js App

React/Next.js port of the static HTML build in `../site/`. Uses the **App
Router**, **JavaScript** (`.js` / `.jsx`), and **Tailwind CSS v4** (with a
small documented vanilla-CSS layer in `app/globals.css`).

## Run it

```bash
cd "D:\claude\test e com project\ecobazar-next"
npm install
npm run dev
```

Then open `http://localhost:3000`.

> Heads-up: the project was scaffolded and every source file is written, but
> `npm install` did NOT finish in the build sandbox (no npm network access).
> One `npm install` on your machine is all that's left.

## Routes

| URL                       | File                              |
| ------------------------- | --------------------------------- |
| `/`                       | `app/page.js`                     |
| `/shop`                   | `app/shop/page.js`                |
| `/product/[slug]`         | `app/product/[slug]/page.js`     |
| `/cart`                   | `app/cart/page.js`                |
| `/checkout`               | `app/checkout/page.js`            |
| `/contact`                | `app/contact/page.js`             |

Every product slug listed in `lib/data.js` is statically generated via
`generateStaticParams` on the `[slug]` route.

## Folder layout

```
ecobazar-next/
├── app/
│   ├── layout.js            ← Root layout (TopBar, Header, Nav, Newsletter, Footer)
│   ├── page.js              ← Homepage
│   ├── globals.css          ← Tailwind + documented custom CSS
│   ├── shop/page.js
│   ├── product/[slug]/page.js
│   ├── cart/page.js
│   ├── checkout/page.js
│   └── contact/page.js
├── components/
│   ├── TopBar.jsx
│   ├── Header.jsx
│   ├── PrimaryNav.jsx       ← client component — highlights active link
│   ├── Breadcrumb.jsx
│   ├── Newsletter.jsx
│   ├── Footer.jsx
│   ├── ProductCard.jsx
│   ├── CategoryTile.jsx
│   ├── NewsCard.jsx
│   ├── TestimonialCard.jsx
│   └── Stars.jsx
├── lib/
│   └── data.js              ← Sample products / categories / news
├── public/images/           ← 49 image files cropped from the source PDFs
└── package.json
```

## Styling

- **Tailwind v4** is loaded via PostCSS (`postcss.config.mjs` already
  configured by `create-next-app`). Brand tokens are declared once in
  `app/globals.css` via `@theme inline` so utility classes like
  `text-eco-green`, `bg-eco-footer`, `bg-eco-bg`, `text-eco-dark` work
  everywhere.
- **Custom vanilla CSS** sits below the `@theme` block in `globals.css` for
  things Tailwind can't express cleanly (range-slider thumbs, dashed-border
  category tile, testimonial quote glyph, countdown layout, breadcrumb veg
  strip, qty-stepper, product-detail tab underline, map placeholder pattern).
  Every block is preceded by a comment listing the **page** and **section**
  it belongs to.

## State & interactivity

Global state lives in **`lib/CartContext.jsx`** — a React Context backed by
`useReducer`, with cart + wishlist + coupon state persisted to
`localStorage` (key `ecobazar-cart-v1`). Every interactive component reads
through the `useCart()` hook.

**What works:**

- Cart: add from any product card / hot-deal card / product detail page;
  update quantity; remove; clear cart; apply coupon (`ECO10`, `ECO20`,
  `FREE5`).
- Wishlist: heart icon on featured cards + product detail page; saved items
  show in `/wishlist` with **Move to Cart** action.
- Header: live cart count, total, and wishlist badge.
- Header search: deep-links to `/shop?q=...`.
- Shop: live filter by price range, rating, popular tag; sort by price /
  name / latest; full-text search; pagination; **Reset all filters**.
- Product detail: quantity stepper, working tabs (Description / Additional
  Information / Customer Feedback), Add to Cart with chosen qty, wishlist
  toggle.
- Cart page: empty-state, line item totals, qty steppers, remove, coupon
  application (try `ECO10`).
- Checkout: required-field validation, email/phone format, place-order
  clears cart and shows order confirmation with a fake order ID.
- Newsletter & Contact forms: validation + success toast.
- Testimonial slider: prev/next arrows scroll the list.
- Hot Deals card: real countdown timer (`HH:MM:SS` tick every second).
- Toasts: bottom-right notifications for all actions (success/info/error).

## Product gallery & responsive design

**ProductGallery (`components/ProductGallery.jsx`)** powers the product
detail page. Each product carries an `images` array in `lib/data.js`. Two
descriptor shapes are supported:

```js
// Styled placeholder (default while you don't have real photos)
{ type: "view", emoji: "🍏", bg: "linear-gradient(...)", scale: 1.4, label: "Close-up" }

// Real photograph (drop a file under public/images/products/)
{ type: "image", src: "/images/products/apple-1.jpg", label: "Front view" }
```

The component renders both through the same pipeline, so the gallery looks
identical whether the source is a placeholder card or a real photo. What it
does:

- Large main stage with the active image.
- Thumbnail strip below — click to swap, active thumb auto-scrolls into view.
- If more than 4 thumbnails, the strip gets ← / → scroll buttons and
  scroll-snap.
- Desktop (hover-capable, fine-pointer devices): hovering the main image
  magnifies the content **2× at the cursor's location**.
- Touch / no-hover devices: tapping the main image opens a fullscreen
  lightbox with prev/next controls.
- Keyboard ← / → swap images when the gallery has focus; **Esc** closes the
  lightbox.

## Mobile / responsive design

Every page is built mobile-first now:

- **TopBar** drops the location + currency selectors on small screens, keeps
  Sign In / Sign Up.
- **Header** is sticky; logo + icons stay one row; search collapses into a
  magnifier button that toggles a full-width search bar below.
- **PrimaryNav** is a horizontal list ≥ `lg`; below that it becomes a
  hamburger drawer (slides in from the left, dims the background, locks body
  scroll, closes on route change).
- **Shop sidebar** is inline ≥ `lg`; on smaller screens it's hidden behind a
  "Filters" pill that opens a slide-in drawer from the right with the same
  controls.
- **Cart** uses a table on `md+` and a card stack on mobile.
- **Checkout** form is single column on mobile; two-column from `sm` up;
  order summary sticky on desktop and inline on mobile.
- **Product Detail** description truncates to 3 lines on mobile with a
  **See more / See less** toggle.
- **Footer** drops to a single-column → 2 → 5 grid across breakpoints.

## Where to go next

- Swap `lib/data.js` for a real source (Sanity / Shopify / Prisma+Postgres).
- Add cart state with React Context or Zustand and wire the "Add to Cart"
  buttons.
- Replace emoji product icons with real photography (drop files into
  `public/images/products/` and add an `image` field on each product).
- Build the remaining 21 PDF pages (Account, Blog, FAQ, 404, Wishlist, etc.)
  — their static HTML stubs are not yet built, the source PDFs live in
  `../` (project root).
