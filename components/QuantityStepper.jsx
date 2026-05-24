"use client";

// components/QuantityStepper.jsx
// Reusable +/- stepper. Two modes:
//   1. Controlled: pass `value` + `onChange`. Used on Cart page (writes to context).
//   2. Uncontrolled: pass `defaultValue`. Used on Product Detail before
//      Add-to-Cart, where the user just picks a quantity locally.

import { useState } from "react";

export default function QuantityStepper({ value, defaultValue = 1, min = 1, max = 999, onChange }) {
  const controlled = typeof value === "number";
  const [internal, setInternal] = useState(defaultValue);
  const current = controlled ? value : internal;

  const update = (next) => {
    const clamped = Math.min(max, Math.max(min, Number(next) || min));
    if (!controlled) setInternal(clamped);
    onChange?.(clamped);
  };

  return (
    <div className="qty-stepper">
      <button type="button" onClick={() => update(current - 1)} aria-label="Decrease quantity">−</button>
      <input
        type="text"
        inputMode="numeric"
        value={current}
        onChange={(e) => update(e.target.value.replace(/[^0-9]/g, ""))}
        aria-label="Quantity"
      />
      <button type="button" onClick={() => update(current + 1)} aria-label="Increase quantity">+</button>
    </div>
  );
}
