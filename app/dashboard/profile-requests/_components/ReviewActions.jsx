"use client";

// Approve / reject controls for one pending request. The note is optional for
// approve but genuinely useful on reject — it is the only thing the requester
// sees explaining why, back on /dashboard/settings.

import { useState, useTransition } from "react";
import { useT } from "../../../../lib/i18n/LanguageProvider";
import { approveChangeAction, rejectChangeAction } from "../_actions";

export default function ReviewActions({ requestId }) {
  const t = useT();
  const [note, setNote]   = useState("");
  const [error, setError] = useState(null);
  const [pending, start]  = useTransition();

  // On success the row disappears (revalidatePath re-renders the list), so only
  // the failure path needs local state.
  const run = (fn) => start(async () => {
    const res = await fn(requestId, note);
    if (!res.ok) setError(res.error);
  });

  return (
    <div className="mt-3">
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t("requests.notePlaceholder")}
        maxLength={500}
        className="eco-input"
      />
      <div className="flex flex-wrap gap-2 mt-2">
        <button
          type="button"
          onClick={() => run(approveChangeAction)}
          disabled={pending}
          className="px-4 py-2 rounded-full bg-eco-green text-white text-sm font-medium disabled:opacity-60 min-h-[40px]"
        >
          <i className="fa-solid fa-check mr-2" />{t("requests.approve")}
        </button>
        <button
          type="button"
          onClick={() => run(rejectChangeAction)}
          disabled={pending}
          className="px-4 py-2 rounded-full border border-red-300 text-red-600 text-sm font-medium disabled:opacity-60 min-h-[40px]"
        >
          <i className="fa-solid fa-xmark mr-2" />{t("requests.reject")}
        </button>
      </div>
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  );
}
