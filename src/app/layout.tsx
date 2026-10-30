import type { Metadata } from "next";
import { headers } from "next/headers";
import { connection } from "next/server";
import { directionFor, isLocale } from "@/i18n/config";
import "@fontsource-variable/newsreader/wght.css";
import "@fontsource-variable/noto-sans-arabic/wght.css";
import "@fontsource/noto-naskh-arabic/400.css";
import "@fontsource/noto-naskh-arabic/600.css";
import "@fontsource/noto-naskh-arabic/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SmartPDF", template: "%s · SmartPDF" },
  description: "Create professional resumes and invoices with a live PDF preview.",
  other: { google: "notranslate" },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  const requested = (await headers()).get("x-smartpdf-locale") ?? "";
  const locale = isLocale(requested) ? requested : "en";
  return <html lang={locale} dir={directionFor(locale)} translate="no" className="notranslate" data-scroll-behavior="smooth"><body><a href="#main-content" className="skip-link">{locale === "ar" ? "تخطَّ إلى المحتوى" : "Skip to content"}</a>{children}</body></html>;
}
