// app/api/auth/[...nextauth]/route.js
// Thin re-export of the Auth.js HTTP handlers (GET/POST). All auth requests
// route through here.
export { GET, POST } from "../../../../auth";

// `handlers` is { GET, POST } in Auth.js v5; re-export both.
