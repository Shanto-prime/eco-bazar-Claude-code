// auth.js
// Thin re-export so older imports like `import { auth } from "./auth"` keep
// working. The canonical NextAuth v5 config now lives in lib/auth.js.
export { handlers, auth, signIn, signOut, hasGoogle, hasFacebook } from "./lib/auth";
