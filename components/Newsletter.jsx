"use client";

// components/Newsletter.jsx — bottom-of-page subscribe band.
// Validates the email, fires a toast, and clears the field.

import { useState } from "react";
import { useCart } from "../lib/CartContext";
import { useT } from "../lib/i18n/LanguageProvider";

export default function Newsletter() {
  const { showToast } = useCart();
  const t = useT();
  const [email, setEmail] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const v = email.trim();
    if (!v || !/^\S+@\S+\.\S+$/.test(v)) {
      showToast(t("newsletter.invalidEmail"), "error");
      return;
    }
    showToast(t("newsletter.subscribed", { email: v }));
    setEmail("");
  };

  return (
    <section className="bg-eco-bg py-10">
      <div className="max-w-[1320px] mx-auto px-6 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1">
          <div className="text-xl font-bold">{t("newsletter.title")}</div>
          <div className="text-sm text-gray-500">
            {t("newsletter.body")}
          </div>
        </div>
        <form onSubmit={submit} className="flex-1 flex bg-white rounded-full overflow-hidden w-full md:w-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("newsletter.placeholder")}
            className="flex-1 px-5 py-3 outline-none text-sm"
            required
          />
          <button type="submit" className="bg-eco-green text-white px-8 font-medium hover:bg-emerald-600">
            {t("newsletter.subscribe")}
          </button>
        </form>
        <div className="flex gap-2">
          <a href="#" className="w-9 h-9 rounded-full bg-eco-green text-white grid place-items-center"><i className="fa-brands fa-facebook-f" /></a>
          <a href="#" className="w-9 h-9 rounded-full bg-gray-100 grid place-items-center hover:bg-eco-green hover:text-white"><i className="fa-brands fa-twitter" /></a>
          <a href="#" className="w-9 h-9 rounded-full bg-gray-100 grid place-items-center hover:bg-eco-green hover:text-white"><i className="fa-brands fa-pinterest" /></a>
          <a href="#" className="w-9 h-9 rounded-full bg-gray-100 grid place-items-center hover:bg-eco-green hover:text-white"><i className="fa-brands fa-instagram" /></a>
        </div>
      </div>
    </section>
  );
}
