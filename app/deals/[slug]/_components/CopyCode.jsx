"use client";

// Promo-code chip with a copy-to-clipboard button. Client component because it
// touches navigator.clipboard.

import { useState } from "react";
import { useT } from "../../../../lib/i18n/LanguageProvider";

export default function CopyCode({ code }) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked — no-op */ }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-2 rounded-lg border border-dashed border-eco-green bg-eco-green/5 px-3 py-2 text-sm font-mono font-semibold text-eco-green hover:bg-eco-green/10"
      title={t("deals.copyCode")}
    >
      {code}
      <i className={`fa-solid ${copied ? "fa-check" : "fa-copy"} text-xs`} />
    </button>
  );
}
