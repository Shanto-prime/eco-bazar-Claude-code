"use client";

// app/cart/page.js — Shopping cart. Fully wired to CartContext.
// Responsive: desktop shows a table; mobile shows stacked cards.

import Link from "next/link";
import { useState } from "react";
import Breadcrumb from "../../components/Breadcrumb";
import QuantityStepper from "../../components/QuantityStepper";
import { useCart } from "../../lib/CartContext";

export default function CartPage() {
  const {
    items, subtotal, discount, total, coupon,
    updateQty, removeItem, applyCoupon, clearCart, hydrated,
  } = useCart();
  const [code, setCode] = useState("");

  if (!hydrated) return null;

  if (items.length === 0) {
    return (
      <>
        <Breadcrumb items={[{ label: "Shopping cart" }]} />
        <section className="max-w-[1320px] mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
          <div className="text-6xl sm:text-7xl mb-4">🛒</div>
          <h1 className="text-xl sm:text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-gray-500 mb-6">Browse the shop and add a few items to get started.</p>
          <Link href="/shop" className="inline-block px-6 py-3 rounded-full bg-eco-green text-white font-medium">
            Start shopping <i className="fa-solid fa-arrow-right ml-1" />
          </Link>
        </section>
      </>
    );
  }

  return (
    <>
      <Breadcrumb items={[{ label: "Shopping cart" }]} />

      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">My Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-8">
            {/* Desktop table ============================================== */}
            <table className="w-full text-sm border border-gray-200 hidden md:table">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 text-left">Product</th>
                  <th className="py-3 px-4 text-left">Price</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4 text-left">Subtotal</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.slug} className="border-t">
                    <td className="py-4 px-4 flex items-center gap-3">
                      <span className="text-3xl">{it.icon}</span>
                      <Link href={`/shop/${it.slug}`} className="hover:text-eco-green">{it.name}</Link>
                    </td>
                    <td className="py-4 px-4">${it.price.toFixed(2)}</td>
                    <td className="py-4 px-4">
                      <QuantityStepper value={it.qty} onChange={(n) => updateQty(it.slug, n)} />
                    </td>
                    <td className="py-4 px-4 font-semibold">${(it.price * it.qty).toFixed(2)}</td>
                    <td className="py-4 px-4 text-right">
                      <button type="button" onClick={() => removeItem(it.slug)} className="text-gray-400 hover:text-red-500" aria-label={`Remove ${it.name}`}>
                        <i className="fa-solid fa-xmark" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile card stack ========================================== */}
            <div className="md:hidden space-y-3">
              {items.map((it) => (
                <div key={it.slug} className="border border-gray-200 rounded-lg p-4 flex gap-4">
                  <div className="text-4xl shrink-0 self-center">{it.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <Link href={`/shop/${it.slug}`} className="font-medium hover:text-eco-green truncate">{it.name}</Link>
                      <button type="button" onClick={() => removeItem(it.slug)} className="text-gray-400 hover:text-red-500 -mt-1 -mr-1 p-1" aria-label={`Remove ${it.name}`}>
                        <i className="fa-solid fa-xmark" />
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">${it.price.toFixed(2)} each</div>
                    <div className="flex items-center justify-between mt-3">
                      <QuantityStepper value={it.qty} onChange={(n) => updateQty(it.slug, n)} />
                      <div className="font-semibold">${(it.price * it.qty).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 justify-between mt-6">
              <Link href="/shop" className="px-5 py-3 border rounded-full text-sm hover:border-eco-green hover:text-eco-green">
                <i className="fa-solid fa-arrow-left mr-1" /> Return to shop
              </Link>
              <button
                type="button"
                onClick={() => { if (confirm("Empty your cart?")) clearCart(); }}
                className="px-5 py-3 border rounded-full text-sm hover:border-red-500 hover:text-red-500"
              >
                Clear Cart
              </button>
            </div>

            <div className="mt-8 sm:mt-10">
              <div className="font-semibold mb-3">
                Coupon Code <span className="text-xs text-gray-400 font-normal">(try ECO10, ECO20, FREE5)</span>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); applyCoupon(code); setCode(""); }} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text" value={code} onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter code" className="eco-input flex-1 rounded-full"
                />
                <button type="submit" className="px-6 py-3 bg-eco-footer text-white rounded-full text-sm whitespace-nowrap">Apply Coupon</button>
              </form>
              {coupon && (
                <div className="mt-3 text-sm text-eco-green">
                  <i className="fa-solid fa-circle-check mr-1" /> Coupon <b>{coupon.code}</b> applied: {coupon.label}
                </div>
              )}
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="border border-gray-200 rounded-md p-6 sticky top-24">
              <div className="font-semibold mb-4">Cart Total</div>
              <div className="flex justify-between text-sm py-3 border-b"><span className="text-gray-500">Subtotal:</span><span className="font-semibold">${subtotal.toFixed(2)}</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-sm py-3 border-b text-eco-green">
                  <span>Discount ({coupon.code}):</span><span className="font-semibold">−${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm py-3 border-b"><span className="text-gray-500">Shipping:</span><span className="font-semibold">Free</span></div>
              <div className="flex justify-between py-3"><span className="text-gray-500">Total:</span><span className="text-lg font-bold">${total.toFixed(2)}</span></div>
              <Link href="/checkout" className="block text-center mt-3 py-3 rounded-full bg-eco-green text-white font-medium hover:bg-emerald-600">
                Proceed to checkout <i className="fa-solid fa-arrow-right ml-1" />
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
