"use client";

// app/dashboard/profile-requests/_components/RequestsBoard.jsx
// The interactive admin queue, based on public/Ecobazar Pending Requests.html:
//   • filter tabs (All / Users / Moderators) by requester role, with counts
//   • one card per pending request — avatar, role badge, from → to diff
//   • Approve applies the change; Reject opens a modal that REQUIRES a note
//     (with canned-reason chips) which the requester sees back in settings
//   • a toast on each decision, and a "recently resolved" list
//
// Pending rows come from the server (props). On a successful decision the row
// is hidden optimistically (hiddenIds) and router.refresh() re-syncs the server
// data — so the sidebar badge and the resolved list update too. hiddenIds is a
// belt-and-braces guard against the row flashing back before the refresh lands.

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "../../../../lib/i18n/LanguageProvider";
import { approveChangeAction, rejectChangeAction } from "../_actions";

// EMAIL/PHONE are the only fields that reach the queue (name/avatar apply
// instantly, addresses are direct CRUD). Icons + label keys per field.
const FIELD_META = {
  EMAIL: { icon: "fa-envelope", labelKey: "settings.email" },
  PHONE: { icon: "fa-phone",    labelKey: "settings.phone" },
};

const ROLE_TAB = { ALL: "ALL", CUSTOMER: "CUSTOMER", MODERATOR: "MODERATOR" };

function initials(name, fallback) {
  const src = (name || fallback || "?").trim();
  return src.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
}

function RoleBadge({ role, t }) {
  const mod = role === "MODERATOR";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
      mod ? "bg-sky-50 text-sky-700 ring-1 ring-sky-200" : "bg-gray-100 text-gray-600 ring-1 ring-gray-200"
    }`}>
      {t(mod ? "requests.roleModerator" : "requests.roleUser")}
    </span>
  );
}

function RequestCard({ req, onApprove, onReject, busy, t }) {
  const meta = FIELD_META[req.field] || { icon: "fa-pen", labelKey: "requests.field" };
  return (
    <article className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5 sm:p-6">
      <div className="flex flex-wrap items-start gap-4">
        <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-eco-green/10 ring-1 ring-eco-green/20 text-eco-green font-semibold shrink-0">
          {initials(req.userName, req.userEmail)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold truncate">{req.userName || req.userEmail}</p>
            <RoleBadge role={req.userRole} t={t} />
            {req.userUsername && <span className="text-xs text-gray-400 font-mono">@{req.userUsername}</span>}
            <span className="ml-auto text-xs text-gray-400">{new Date(req.createdAt).toLocaleString()}</span>
          </div>

          {/* Change summary: old value struck through → new value highlighted */}
          <div className="mt-3 rounded-xl bg-gray-50 border border-gray-200 p-3.5">
            <div className="flex items-center gap-2 text-[13px] font-medium">
              <i className={`fa-solid ${meta.icon} text-eco-green`} />
              {t("requests.fieldChange", { field: t(meta.labelKey) })}
            </div>
            <div className="mt-2 grid sm:grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
              <div className="rounded-lg bg-white border border-gray-200 px-3 py-2 text-gray-500 line-through break-all">
                {req.currentValue || t("settings.notSet")}
              </div>
              <i className="fa-solid fa-arrow-right text-gray-400 mx-auto rotate-90 sm:rotate-0" />
              <div className="rounded-lg bg-eco-green/10 border border-eco-green/20 px-3 py-2 font-medium text-eco-green break-all">
                {req.newValue}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onApprove(req)}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-eco-green px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 shadow-sm transition disabled:opacity-60 min-h-[40px]"
            >
              <i className="fa-solid fa-check" />{t("requests.approve")}
            </button>
            <button
              type="button"
              onClick={() => onReject(req)}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-200 transition disabled:opacity-60 min-h-[40px]"
            >
              <i className="fa-solid fa-xmark" />{t("requests.rejectEllipsis")}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function RejectModal({ req, onClose, onSubmit, busy, t }) {
  const [note, setNote] = useState("");
  const canned = [
    t("requests.canned.unverified"),
    t("requests.canned.inUse"),
    t("requests.canned.suspicious"),
  ];
  const trimmed = note.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-200">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold">{t("requests.rejectTitle")}</h2>
          <button type="button" onClick={onClose} disabled={busy} className="text-gray-400 hover:text-gray-900 disabled:opacity-50">
            <i className="fa-solid fa-xmark text-lg" />
          </button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); if (trimmed) onSubmit(req, trimmed); }}
          className="p-5"
        >
          <p className="text-sm text-gray-600">
            {t("requests.rejectIntro", {
              who: req.userName || req.userEmail,
              field: t((FIELD_META[req.field] || {}).labelKey || "requests.field").toLowerCase(),
            })}
          </p>
          <label className="block mt-4">
            <span className="block text-[13px] font-medium mb-1.5">
              {t("requests.reason")} <span className="text-red-600">*</span>
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
              rows={3}
              maxLength={500}
              autoFocus
              placeholder={t("requests.reasonPlaceholder")}
              className="w-full rounded-xl bg-white border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/30"
            />
          </label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {canned.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNote(c)}
                className="rounded-full bg-gray-50 border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:border-red-300"
              >
                {c}
              </button>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} disabled={busy} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              {t("settings.cancel")}
            </button>
            <button
              type="submit"
              disabled={busy || !trimmed}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 shadow-sm disabled:opacity-50"
            >
              {busy ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-xmark" />}
              {t("requests.rejectSubmit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResolvedRow({ r, t }) {
  const ok = r.status === "APPROVED";
  return (
    <div className="rounded-xl bg-white border border-gray-200 px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
        ok ? "bg-eco-green/10 text-eco-green ring-1 ring-eco-green/20" : "bg-red-50 text-red-700 ring-1 ring-red-200"
      }`}>
        {t(`settings.status${r.status}`)}
      </span>
      <span className="font-medium truncate max-w-[160px]">{r.userName || r.userEmail}</span>
      <span className="text-gray-400">{t((FIELD_META[r.field] || {}).labelKey || "requests.field")}</span>
      <span className="text-gray-600 break-all">{r.newValue}</span>
      {r.reviewerName && <span className="text-xs text-gray-400">{t("requests.by")} {r.reviewerName}</span>}
      {r.reviewNote && r.status === "REJECTED" && (
        <span className="w-full sm:w-auto sm:ml-auto text-xs text-gray-400 italic">“{r.reviewNote}”</span>
      )}
    </div>
  );
}

export default function RequestsBoard({ pending, resolved }) {
  const t = useT();
  const router = useRouter();
  const [filter, setFilter]     = useState(ROLE_TAB.ALL);
  const [hiddenIds, setHidden]  = useState(() => new Set());
  const [rejecting, setRejecting] = useState(null); // request being rejected, or null
  const [toast, setToast]       = useState(null);   // { ok, msg }
  const [pendingTx, start]      = useTransition();

  // Live pending = server rows minus anything just actioned this session.
  const livePending = useMemo(
    () => pending.filter((r) => !hiddenIds.has(r.id)),
    [pending, hiddenIds],
  );

  const counts = useMemo(() => ({
    ALL:       livePending.length,
    CUSTOMER:  livePending.filter((r) => r.userRole === "CUSTOMER").length,
    MODERATOR: livePending.filter((r) => r.userRole === "MODERATOR").length,
  }), [livePending]);

  const visible = filter === ROLE_TAB.ALL ? livePending : livePending.filter((r) => r.userRole === filter);

  const flash = (ok, msg) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 2600);
  };

  const approve = (req) => start(async () => {
    const res = await approveChangeAction(req.id);
    if (res.ok) {
      setHidden((s) => new Set(s).add(req.id));
      flash(true, t("requests.toastApproved", { who: req.userName || req.userEmail }));
      router.refresh();
    } else {
      flash(false, res.error);
    }
  });

  const reject = (req, note) => start(async () => {
    const res = await rejectChangeAction(req.id, note);
    if (res.ok) {
      setHidden((s) => new Set(s).add(req.id));
      setRejecting(null);
      flash(true, t("requests.toastRejected", { who: req.userName || req.userEmail }));
      router.refresh();
    } else {
      flash(false, res.error);
    }
  });

  const TABS = [
    { key: ROLE_TAB.ALL,       label: t("dashboard.statusAll") },
    { key: ROLE_TAB.CUSTOMER,  label: t("requests.tabUsers") },
    { key: ROLE_TAB.MODERATOR, label: t("requests.tabModerators") },
  ];

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-2 text-sm mb-5">
        {TABS.map((tab) => {
          const active = filter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`rounded-full px-3.5 py-1.5 font-medium border transition ${
                active
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white border-gray-200 text-gray-600 hover:border-eco-green hover:text-eco-green"
              }`}
            >
              {tab.label} <span className={active ? "opacity-70" : "opacity-60"}>({counts[tab.key]})</span>
            </button>
          );
        })}
      </div>

      {/* Pending list */}
      {visible.length > 0 ? (
        <div className="space-y-4">
          {visible.map((req) => (
            <RequestCard
              key={req.id}
              req={req}
              onApprove={approve}
              onReject={setRejecting}
              busy={pendingTx}
              t={t}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-gray-200 p-12 text-center">
          <span className="mx-auto inline-flex items-center justify-center w-12 h-12 rounded-full bg-eco-green/10 text-eco-green">
            <i className="fa-solid fa-check text-xl" />
          </span>
          <p className="mt-3 font-semibold">{t("requests.allClear")}</p>
          <p className="mt-1 text-sm text-gray-400">{t("requests.allClearHint")}</p>
        </div>
      )}

      {/* Recently resolved */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-400">{t("requests.history")}</h2>
        {resolved.length > 0 ? (
          <div className="mt-3 space-y-2">
            {resolved.map((r) => <ResolvedRow key={r.id} r={r} t={t} />)}
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-400">{t("requests.historyEmpty")}</p>
        )}
      </section>

      {rejecting && (
        <RejectModal
          req={rejecting}
          onClose={() => setRejecting(null)}
          onSubmit={reject}
          busy={pendingTx}
          t={t}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-gray-900 text-white text-sm rounded-xl shadow-lg px-4 py-3 flex items-center gap-2.5">
            <i className={`fa-solid ${toast.ok ? "fa-check text-eco-green" : "fa-xmark text-red-400"}`} />
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}
