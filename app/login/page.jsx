// app/login/page.jsx   Server entry. Reads OAuth env flags server-side and
// passes them as booleans to the client form, so empty OAuth envs => no
// "Continue with X" buttons rendered at all.
//
// Also blocks the form entirely when the visitor is ALREADY signed in   a
// logged-in user hitting /login should not see a login prompt. Shows a small
// "you're signed in as X" panel with a link to their intended destination
// instead. Same treatment for /register (which extends this behaviour via the
// register page's own already-signed-in check).

import Link from "next/link";
import { Suspense } from "react";
import { hasGoogle, hasFacebook } from "../../lib/auth";
import { getT } from "../../lib/i18n/server";
import { getCurrentUser } from "../../lib/auth-helpers";
import LoginForm from "./LoginForm";

export async function generateMetadata() {
    const { t } = await getT();
    return { title: t("meta.loginTitle") };
}

export default async function LoginPage({ searchParams }) {
    const { t } = await getT();
    const sp = (await searchParams) || {};
    const next =
        typeof sp.next === "string" && sp.next.startsWith("/")
            ? sp.next
            : "/dashboard";
    const user = await getCurrentUser();

    if (user) {
        return (
            <section className="max-w-[1320px] mx-auto px-4 sm:px-6 py-12 sm:py-20 min-h-[60vh] grid place-items-center">
                <div className="w-full max-w-md text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-eco-green/10 text-eco-green grid place-items-center mb-5">
                        <i className="fa-solid fa-user-check text-3xl sm:text-4xl" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-eco-dark mb-2">
                        {t("unauthorized.alreadySignedIn", {
                            name: user.name || user.email,
                        })}
                    </h1>
                    <p className="text-sm text-gray-500 mb-6 sm:mb-8">
                        {t("unauthorized.signedInAs", {
                            name: user.email,
                            role: user.role,
                        })}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            href={next}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-eco-green text-white font-medium hover:bg-emerald-600 min-h-[44px]"
                        >
                            {t("unauthorized.goToDest", { path: next })}{" "}
                            <i className="fa-solid fa-arrow-right text-xs" />
                        </Link>
                        {/* Genuine "not me" case   hand them a sign-out link so they can
                come back and enter different credentials. */}
                        <Link
                            href="/api/auth/signout"
                            className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-gray-200 text-gray-700 hover:border-eco-green hover:text-eco-green min-h-[44px]"
                        >
                            {t("unauthorized.signOut")}
                        </Link>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <Suspense fallback={null}>
            <LoginForm hasGoogle={hasGoogle} hasFacebook={hasFacebook} />
        </Suspense>
    );
}
