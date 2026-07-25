"use client";

// app/dashboard/approvals/ApprovalsBoard.jsx
// Admin review list: each pending request gets Approve / Reject. Approve runs
// the real action server-side; Reject asks for an optional note.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "../../../lib/i18n/LanguageProvider";
import { approveRequest, rejectRequest } from "./_actions";

const TYPE_KEY = {
  PRODUCT_DELETE: "dashboard.approvalProductDelete",
  ORDER_CANCEL:   "dashboard.approvalOrderCancel",
};
const TYPE_ICON = {
  PRODUCT_DELETE: "fa-trash",
  ORDER_CANCEL:   "fa-ban",
};

export default function ApprovalsBoard({ requests }) {
  const t = useT();
  const router = useRouter();
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [pending, startTransition] = useTransition();

  if (!requests.length) {
    return (
      <div className="border border-dashed border-gray-200 rounded-lg p-10 text-center text-gray-500">
        <div className="text-5xl mb-3">✅</div>
        {t("dashboard.approvalsEmpty")}
      </div>
    );
  }

  const run = (id, fn) => {
    setError(null); setBusyId(id);
    startTransition(async () => {
      const res = await fn();
      setBusyId(null);
      if (!res?.ok) { setError(res?.error || t("dashboard.approvalFailed")); return; }
      router.refresh();
    });
  };

  const onApprove = (id) => {
    if (!confirm(t("dashboard.confirmApprove"))) return;
    run(id, () => approveRequest({ requestId: id }));
  };
  const onReject = (id) => {
    const note = prompt(t("dashboard.rejectNotePrompt")) ?? "";
    run(id, () => rejectRequest({ requestId: id, note: note || undefined }));
  };

  return (
    <div className="space-y-3">
      {error && <div className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>}
      {requests.map((r) => (
        <div key={r.id} className="bg-white border border-gray-200 rounded-lg p-4 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 text-amber-800 text-xs font-medium px-3 py-1">
            <i className={`fa-solid ${TYPE_ICON[r.type] || "fa-clipboard-check"}`} /> {t(TYPE_KEY[r.type] || "dashboard.approvalRequest")}
          </span>
          <div className="min-w-0">
            <div className="font-medium truncate">{r.entityLabel}</div>
            <div className="text-xs text-gray-500">{t("dashboard.requestedBy", { name: r.requester })} · {new Date(r.createdAt).toLocaleString()}</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button" onClick={() => onApprove(r.id)} disabled={pending && busyId === r.id}
              className="rounded-md bg-eco-green text-white text-sm font-medium px-4 py-2 hover:bg-emerald-600 disabled:opacity-60"
            >{t("dashboard.approve")}</button>
            <button
              type="button" onClick={() => onReject(r.id)} disabled={pending && busyId === r.id}
              className="rounded-md border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 hover:border-red-400 hover:text-red-600 disabled:opacity-60"
            >{t("dashboard.reject")}</button>
          </div>
        </div>
      ))}
    </div>
  );
}
