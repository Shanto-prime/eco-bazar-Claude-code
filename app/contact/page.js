"use client";

// app/contact/page.js — Contact page with validated message form.

import { useState } from "react";
import Breadcrumb from "../../components/Breadcrumb";
import { useCart } from "../../lib/CartContext";

const cards = [
  { icon: "fa-location-dot", text: "3119 Ash St, San Jose,\nSouth Dakota 83476" },
  { icon: "fa-envelope",     text: "Proxy@gmail.com\nHelp.proxy@gmail.com" },
  { icon: "fa-phone",        text: "(219) 555-0114\n(164) 333-0487" },
];

export default function ContactPage() {
  const { showToast } = useCart();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim())    errs.name = "Required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Invalid email";
    if (!form.subject.trim()) errs.subject = "Required";
    if (form.message.trim().length < 10) errs.message = "Please write a bit more (≥10 chars)";
    setErrors(errs);
    if (Object.keys(errs).length) {
      showToast("Please fix the highlighted fields", "error");
      return;
    }
    showToast("Thanks! We'll get back to you within 24 hours.");
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <>
      <Breadcrumb items={[{ label: "Contact" }]} />

      <section className="max-w-[1320px] mx-auto px-6 py-10 grid grid-cols-12 gap-8">
        <aside className="col-span-12 lg:col-span-4 space-y-6">
          {cards.map((c, i) => (
            <div key={i} className="border border-gray-200 rounded-md p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-green-50 grid place-items-center text-eco-green">
                <i className={`fa-solid ${c.icon}`} />
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-line">{c.text}</div>
            </div>
          ))}
        </aside>

        <div className="col-span-12 lg:col-span-8 border border-gray-200 rounded-md p-8">
          <h2 className="text-2xl font-bold">Just Say Hello!</h2>
          <p className="text-sm text-gray-500 mt-1">Pellentesque eu nibh eget mauris congue mattis mattis nec tellus.</p>
          <form onSubmit={submit} noValidate className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <input className={`eco-input ${errors.name ? "border-red-500" : ""}`} value={form.name} onChange={set("name")} placeholder="Your name" />
              {errors.name && <div className="text-xs text-red-500 mt-1">{errors.name}</div>}
            </div>
            <div>
              <input className={`eco-input ${errors.email ? "border-red-500" : ""}`} value={form.email} onChange={set("email")} placeholder="you@example.com" />
              {errors.email && <div className="text-xs text-red-500 mt-1">{errors.email}</div>}
            </div>
            <div className="col-span-2">
              <input className={`eco-input ${errors.subject ? "border-red-500" : "border-eco-green"}`} value={form.subject} onChange={set("subject")} placeholder="Subject" />
              {errors.subject && <div className="text-xs text-red-500 mt-1">{errors.subject}</div>}
            </div>
            <div className="col-span-2">
              <textarea className={`eco-input ${errors.message ? "border-red-500" : ""}`} rows={5} value={form.message} onChange={set("message")} placeholder="Your message" />
              {errors.message && <div className="text-xs text-red-500 mt-1">{errors.message}</div>}
            </div>
            <button type="submit" className="col-span-2 md:col-span-1 px-8 py-3 rounded-full bg-eco-green text-white font-medium hover:bg-emerald-600">
              Send Message <i className="fa-solid fa-arrow-right ml-1" />
            </button>
          </form>
        </div>
      </section>

      <section>
        <div className="map-placeholder h-80 grid place-items-center">
          <div className="text-center">
            <i className="fa-solid fa-map-location-dot text-4xl text-eco-green mb-2" />
            <div className="font-semibold">Our Store Location</div>
            <div className="text-sm">Lincoln-344, Illinois, Chicago, USA</div>
          </div>
        </div>
      </section>
    </>
  );
}
