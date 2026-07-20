"use client";

// app/dashboard/settings/_components/ui.jsx
// Shared chrome for the settings sections, so Profile / Contact / Password /
// Addresses stay visually identical without copy-pasting card markup.
//
// bg-white + border-gray-200 are deliberate: globals.css maps both to dark
// surfaces under `.dark`, so these cards theme themselves. Hard-coding a
// specific hex here would break dark mode.

export function Card({ title, description, children }) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Field({ label, hint, wide, children }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label className="text-xs text-gray-500 block mb-1">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

// Renders whatever the server action returned ({ok,message} | {ok:false,error}).
export function Notice({ result }) {
  if (!result) return null;
  const good = result.ok;
  return (
    <p
      role="status"
      className={`text-sm mt-3 flex items-start gap-2 ${good ? "text-eco-green" : "text-red-500"}`}
    >
      <i className={`fa-solid ${good ? "fa-circle-check" : "fa-circle-exclamation"} mt-0.5`} />
      <span>{good ? result.message : result.error}</span>
    </p>
  );
}

export function SubmitButton({ pending, children, className = "" }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={`px-5 py-2.5 rounded-full bg-eco-green text-white text-sm font-medium hover:bg-emerald-600 disabled:opacity-60 min-h-[44px] ${className}`}
    >
      {pending ? <i className="fa-solid fa-spinner fa-spin mr-2" /> : null}
      {children}
    </button>
  );
}
