"use client";

// app/dashboard/settings/_components/ui.jsx
// Shared chrome for the settings sections. Layout follows components/settings.html:
// a Stripe-style row — section title/description on the left (sm+), controls on
// the right — inside a soft rounded-2xl card.
//
// Colours use the app's dark-mode-aware utilities (bg-white, border-gray-200,
// text-gray-500 …) rather than the mockup's hard-coded hexes, so these cards
// theme themselves under `.dark` (globals.css remaps those classes). eco-input
// gets a rounded-xl bump to match the mockup's softer fields while keeping its
// dark-mode background/text overrides.

export function Card({ id, title, description, children }) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl bg-white border border-gray-200 shadow-sm"
    >
      <div className="p-6 sm:p-7 grid sm:grid-cols-[220px_1fr] gap-6">
        <div>
          <h2 className="font-semibold">{title}</h2>
          {description && (
            <p className="mt-1 text-[13px] leading-relaxed text-gray-500">{description}</p>
          )}
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}

export function Field({ label, hint, required, wide, children }) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="block text-[13px] font-medium mb-1.5">
        {label} {required && <span className="text-eco-green">*</span>}
      </span>
      {children}
      {hint && <span className="block mt-1.5 text-xs text-gray-400">{hint}</span>}
    </label>
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

// Primary (filled green) button — used for the main save in each section.
export function SubmitButton({ pending, children, className = "", ...rest }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-eco-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60 shadow-sm transition min-h-[44px] ${className}`}
      {...rest}
    >
      {pending ? <i className="fa-solid fa-spinner fa-spin" /> : null}
      {children}
    </button>
  );
}

// Secondary (outlined) button — Edit / Cancel / Add, matching the mockup's
// white ring-1 pills.
export function GhostButton({ children, className = "", ...rest }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-gray-200 px-3.5 py-2 text-sm font-medium hover:bg-gray-50 min-h-[40px] ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
