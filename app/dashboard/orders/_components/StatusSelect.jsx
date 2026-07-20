"use client";

// app/dashboard/orders/_components/StatusSelect.jsx
// Inline per-row order status picker, ADMIN only. Same shape as the users
// RoleSelect: optimistic <select>, call the server action, roll back + show the
// error if it rejects (e.g. "order is cancelled and can't be changed"), then
// router.refresh() so the server-rendered row and its timeline re-render.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "../../../../lib/i18n/LanguageProvider";
import { ORDER_STATUSES, STATUS_TEXT, isTerminal, statusKey } from "../../../../lib/order-status";
import { updateOrderStatusAction } from "../_actions";

export default function StatusSelect({ orderId, status }) {
  const t = useT();
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  // Terminal states are rejected server-side too; disabling here just avoids a
  // pointless round-trip and makes the rule visible in the UI.
  const locked = isTerminal(value);

  const onChange = (e) => {
    const next = e.target.value;
    const prev = value;
    setValue(next);
    setError(null);
    startTransition(async () => {
      const res = await updateOrderStatusAction({ orderId, status: next });
      if (!res?.ok) {
        setValue(prev);
        setError(res?.error || t("dashboard.statusUpdateFailed"));
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <select
        value={value}
        onChange={onChange}
        disabled={locked || pending}
        title={locked ? t("dashboard.statusLocked") : undefined}
        className={`text-xs font-medium rounded-md border border-gray-200 bg-white px-2 py-1 disabled:opacity-60 disabled:cursor-not-allowed ${STATUS_TEXT[value] || ""}`}
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>{t(statusKey(s))}</option>
        ))}
      </select>
      {error && <span className="text-xs text-red-600 max-w-[10rem]">{error}</span>}
    </div>
  );
}
