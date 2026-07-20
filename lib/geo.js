// lib/geo.js
// The country/state option sets used by BOTH the checkout billing form and the
// settings address book.
//
// These must stay identical: checkout renders country/state as <select>s, and a
// saved address prefills them. If the address book allowed a value checkout has
// no <option> for, React would silently drop the selection back to "" and the
// user would lose their prefill without any error. One list, one source.
//
// Values are stored verbatim on Address/Order, so treat them as stable
// identifiers — renaming one orphans existing rows.

export const COUNTRIES = ["USA", "Canada", "UK"];

export const STATES = ["Illinois", "California", "New York"];
