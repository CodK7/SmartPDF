import type { Metadata } from "next";
import { connection } from "next/server";
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
  return <html lang="en" dir="ltr" translate="no" className="notranslate" data-scroll-behavior="smooth"><body><a href="#main-content" className="skip-link">Skip to content</a>{children}</body></html>;
}
