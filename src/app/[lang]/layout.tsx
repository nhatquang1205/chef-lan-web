import type { Metadata } from "next";
import { Barlow_Semi_Condensed, Yeseva_One } from "next/font/google";
import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { hasLocale, locales } from "@/i18n/config";
import "../globals.css";

// Stand-ins for the brand fonts (GLANCE for titles, Calps Sans for content), which are
// commercial. Both include the Vietnamese subset.
const display = Yeseva_One({ weight: "400", subsets: ["latin", "vietnamese"], variable: "--font-yeseva" });
const body = Barlow_Semi_Condensed({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-barlow",
});

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const dict = hasLocale(lang) ? (await import(`@/i18n/dictionaries/${lang}.json`)).default : null;

  return {
    title: { default: dict?.meta.title ?? "Bon Bocon", template: "%s · Bon Bocon" },
    description: dict?.meta.description,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const lang = await getLocale();
  const dict = await getDictionary();

  return (
    <html lang={lang} data-scroll-behavior="smooth" className={`${display.variable} ${body.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <AuthProvider>
          {/* The header reads the pathname, which is only known per request. */}
          <Suspense
            fallback={
              <header className="sticky top-0 z-40 h-16 border-b border-beige/15 bg-olive/90">
                <div className="mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6">
                  <Logo lang={lang} />
                </div>
              </header>
            }
          >
            <SiteHeader lang={lang} dict={dict} />
          </Suspense>
          <main className="flex-1">{children}</main>
          <Footer dict={dict} />
        </AuthProvider>
      </body>
    </html>
  );
}
