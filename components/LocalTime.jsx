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

const OPTS = {
  dateStyle: "medium",
  timeStyle: "short",
};

export default function LocalTime({ value, className }) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  return (
    <time dateTime={d.toISOString()} className={className} suppressHydrationWarning>
      {d.toLocaleString(undefined, OPTS)}
    </time>
  );
}
