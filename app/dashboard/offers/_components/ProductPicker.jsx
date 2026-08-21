"use client";

// app/dashboard/offers/_components/ProductPicker.jsx
// Search-and-select one product for a Hot Deals offer.
//
// Reuses the existing public search endpoint (/api/products, backed by
// queryProducts) rather than adding an admin-only one: it already does
// case-insensitive name/slug search in the database and returns the shaped
// product   image, price and slug   which is exactly what the result rows and the
// selected-product preview need.
//
// The chosen product's id is written to a hidden input so the surrounding <form>
// submits it like any other field; the server action re-reads the product from
// the DB and never trusts anything else the browser sent about it.

import { useEffect, useRef, useState } from "react";
import { useT } from "../../../../lib/i18n/LanguageProvider";
import { useMoney } from "../../../../lib/currency/CurrencyProvider";

const MIN_QUERY = 2;
const DEBOUNCE_MS = 300;

export default function ProductPicker({ value, onChange }) {
    const t = useT();
    const money = useMoney();

    const [term, setTerm] = useState("");
    const [results, setResults] = useState([]);
    const [busy, setBusy] = useState(false);
    const [open, setOpen] = useState(false);
    const boxRef = useRef(null);

    const query = term.trim();
    const searchable = query.length >= MIN_QUERY;

    // Debounced search. Each run aborts the previous request so a slow earlier
    // response can't overwrite the results of a newer, narrower query.
    //
    // Nothing is set synchronously in the effect body   a too-short query is
    // handled by deriving `visible` below rather than by clearing state here, and
    // `busy` flips only inside the async callback. Synchronous setState in an
    // effect body triggers an extra render pass (react-hooks/set-state-in-effect).
    useEffect(() => {
        if (!searchable) return;

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setBusy(true);
            try {
                const res = await fetch(
                    `/api/products?q=${encodeURIComponent(query)}&perPage=8&sort=name`,
                    { signal: controller.signal },
                );
                const json = await res.json();
                setResults(Array.isArray(json?.items) ? json.items : []);
                setOpen(true);
            } catch {
                // Aborted or offline   leave the previous results in place.
            } finally {
                setBusy(false);
            }
        }, DEBOUNCE_MS);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query, searchable]);

    // Results only belong on screen while the query is long enough to have
    // produced them; a shortened query hides the stale list without a state write.
    const visible = searchable ? results : [];

    // Close the result list on an outside click, so it doesn't hover over the rest
    // of the form after the admin has moved on.
    useEffect(() => {
        const onDocClick = (e) => {
            if (boxRef.current && !boxRef.current.contains(e.target))
                setOpen(false);
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    const pick = (p) => {
        onChange?.(p);
        setTerm("");
        setResults([]);
        setOpen(false);
    };

    return (
        <div className="mb-5">
            {/* The id the form actually submits. */}
            <input type="hidden" name="productId" value={value?.id || ""} />

            <label className="block text-[13px] font-medium mb-1.5">
                {t("offers.product")} <span className="text-eco-green">*</span>
            </label>

            {value ? (
                // Selected state: show what the customer will see on the card.
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-50 grid place-items-center shrink-0">
                        {value.image ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                                src={value.image}
                                alt=""
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <i className="fa-regular fa-image text-gray-300 text-lg" />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">
                            {value.name}
                        </div>
                        <div className="text-xs text-gray-500">
                            {money(value.basePrice ?? value.price)}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => onChange?.(null)}
                        className="text-xs font-medium text-eco-green hover:underline shrink-0"
                    >
                        {t("offers.change")}
                    </button>
                </div>
            ) : (
                <div ref={boxRef} className="relative">
                    <div className="flex rounded-xl border border-gray-200 bg-white focus-within:border-eco-green overflow-hidden">
                        <span className="inline-flex items-center pl-3 text-gray-400">
                            <i className="fa-solid fa-magnifying-glass text-xs" />
                        </span>
                        <input
                            type="text"
                            value={term}
                            onChange={(e) => setTerm(e.target.value)}
                            onFocus={() => visible.length && setOpen(true)}
                            placeholder={t("offers.searchPlaceholder")}
                            className="w-full px-3 py-2.5 text-sm bg-transparent focus:outline-none"
                        />
                        {busy && (
                            <span className="inline-flex items-center pr-3 text-gray-400">
                                <i className="fa-solid fa-spinner fa-spin text-xs" />
                            </span>
                        )}
                    </div>

                    {open && (
                        <ul className="absolute z-30 left-0 right-0 mt-1 max-h-72 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                            {visible.length === 0 && !busy && (
                                <li className="px-3 py-2.5 text-sm text-gray-400">
                                    {t("offers.noResults")}
                                </li>
                            )}
                            {visible.map((p) => (
                                <li key={p.id}>
                                    <button
                                        type="button"
                                        onClick={() => pick(p)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50"
                                    >
                                        <span className="w-9 h-9 rounded-md overflow-hidden bg-gray-50 grid place-items-center shrink-0">
                                            {p.image ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img
                                                    src={p.image}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <i className="fa-regular fa-image text-gray-300 text-xs" />
                                            )}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm truncate">
                                                {p.name}
                                            </span>
                                            <span className="block text-xs text-gray-400">
                                                {money(p.basePrice ?? p.price)}
                                            </span>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    <span className="block mt-1 text-xs text-gray-400">
                        {query.length > 0 && !searchable
                            ? t("offers.searchHint")
                            : t("offers.productHint")}
                    </span>
                </div>
            )}
        </div>
    );
}
