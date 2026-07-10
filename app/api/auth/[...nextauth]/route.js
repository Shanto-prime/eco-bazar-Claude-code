// app/api/auth/[...nextauth]/route.js
// Thin re-export of the Auth.js HTTP handlers. All auth requests route here.
// In Auth.js v5, NextAuth() returns `handlers` = { GET, POST }; there are no
// top-level GET/POST exports, so we destructure them off `handlers`.
import { handlers } from "../../../../auth";

export const { GET, POST } = handlers;
