import { Poppins } from "next/font/google";
import "./globals.css";
import { CartProvider } from "../lib/CartContext";
import { LanguageProvider } from "../lib/i18n/LanguageProvider";
import { getLocale } from "../lib/i18n/server";
import { ThemeProvider } from "../lib/theme/ThemeProvider";
import { getTheme } from "../lib/theme/server";
import Toast from "../components/Toast";
import TopBar from "../components/TopBar";
import Header from "../components/Header";
import PrimaryNav from "../components/PrimaryNav";
import Newsletter from "../components/Newsletter";
import Footer from "../components/Footer";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Ecobazar — Organic Food Store",
  description: "Fresh & healthy organic food, delivered to your door.",
};

export default async function RootLayout({ children }) {
  const [locale, theme] = await Promise.all([getLocale(), getTheme()]);

  return (
    <html
      lang={locale}
      className={`${poppins.variable} antialiased ${theme === "dark" ? "dark" : ""}`}
    >
      <head>
        {/* Font Awesome icons used across the UI */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <ThemeProvider initialTheme={theme}>
          <LanguageProvider initialLocale={locale}>
            <CartProvider>
              <TopBar />
              <Header />
              <PrimaryNav />
              <main className="flex-1">{children}</main>
              <Newsletter />
              <Footer />
              <Toast />
            </CartProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
