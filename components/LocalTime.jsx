"use client";

// components/LocalTime.jsx — render a timestamp in the VIEWER's timezone.
//
// A server component formatting with toLocaleString() uses the SERVER's locale and
// timezone, so a customer in Dhaka would read Chicago (or, on Vercel, UTC) times.
//
// WHY THE EFFECT, and why suppressHydrationWarning alone was not enough:
// this is a client component, but Next still server-renders it, so the markup
// arrives already formatted. `suppressHydrationWarning` silences the resulting
// text mismatch — and React ALSO leaves the server's text in the DOM rather than
// patching it. The attribute hides the symptom while the wrong value stays on
// screen; nothing re-formats until some later render happens to touch the node.
// Proven by e2e/fix03-timezone.spec.js, which loaded the same page under
// Asia/Dhaka and America/Los_Angeles and got identical strings.
//
// Reformatting inside an effect forces the re-render that actually replaces it.
// The server pass is pinned to UTC so the initial HTML is deterministic (no
// dependency on where it renders) and there is no layout shift — the string is
// the same shape either way.
//
// NOTE: this trips react-hooks/set-state-in-effect. That rule is right in general,
// but the viewer's timezone is knowable only in the browser, so a post-mount
// render is the point rather than an accident.

import { useEffect, useState } from "react";

const DATE_TIME = { dateStyle: "medium", timeStyle: "short" };
const DATE_ONLY = { dateStyle: "medium" };

// Node and Chrome ship different ICU versions, and newer ones separate the time
// from AM/PM with U+202F (narrow no-break space) where older ones use a plain
// space. That single invisible character is enough for the server string and the
// client's first render to differ, which React reports as a hydration failure and
// "recovers" from by regenerating the tree. Collapsing every whitespace character
// to a plain space makes the initial pass byte-identical on both sides.
function stableSpaces(s) {
  return s.replace(/\s/g, " ");
}

// `dateOnly` drops the clock time, for columns that only ever showed a date
// (previously `toLocaleDateString()`). A bare date is the more dangerous case:
// for a viewer whose offset crosses midnight relative to the server it can land
// on the WRONG DAY, not merely the wrong hour.
export default function LocalTime({ value, className, dateOnly = false }) {
  const iso = value ? new Date(value) : null;
  const valid = iso && !Number.isNaN(iso.getTime());

  const opts = dateOnly ? DATE_ONLY : DATE_TIME;

  // Server/initial pass: fixed locale + UTC, so SSR output never depends on the
  // host's configuration.
  const [text, setText] = useState(() =>
    valid ? stableSpaces(iso.toLocaleString("en-US", { ...opts, timeZone: "UTC" })) : "",
  );

  useEffect(() => {
    if (!valid) return;
    // No explicit locale or timeZone: both come from the browser.
    setText(new Date(value).toLocaleString(undefined, opts));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, dateOnly]);

  if (!valid) return null;

  return (
    <time dateTime={iso.toISOString()} className={className} suppressHydrationWarning>
      {text}
    </time>
  );
}
