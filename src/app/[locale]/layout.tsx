import { notFound } from "next/navigation";
import { Providers } from "@/app/providers";
import { directionFor, isLocale } from "@/i18n/config";

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const direction = directionFor(locale);
  return <Providers direction={direction}><div lang={locale} dir={direction}>{children}</div></Providers>;
}
