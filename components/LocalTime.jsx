"use client";

// components/LocalTime.jsx — render a timestamp in the VIEWER's timezone.
//
// A server component formatting with toLocaleString() would use the server's
// locale and timezone, so a customer in Dhaka would see Chicago times. This
// formats on the client instead.
//
// The server still renders a value (so there's no layout shift and the markup
// degrades gracefully), and it will legitimately differ from the client's
// first render whenever the two timezones differ — that's what
// suppressHydrationWarning acknowledges. React keeps the client value after
// hydration, which is the correct one.

const DATE_TIME = { dateStyle: "medium", timeStyle: "short" };
const DATE_ONLY = { dateStyle: "medium" };

// `dateOnly` drops the clock time, for columns that only ever showed a date
// (previously `toLocaleDateString()`). Worth having here rather than at the call
// site: a bare toLocaleDateString on the server can land on the WRONG DAY for a
// viewer whose offset crosses midnight relative to the server, which on Vercel
// is always UTC.
export default function LocalTime({ value, className, dateOnly = false }) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  return (
    <time dateTime={d.toISOString()} className={className} suppressHydrationWarning>
      {d.toLocaleString(undefined, dateOnly ? DATE_ONLY : DATE_TIME)}
    </time>
  );
}
