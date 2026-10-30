import { notFound } from "next/navigation";
import { LandingPage } from "@/features/marketing/landing-page";
import { isLocale } from "@/i18n/config";

export default async function Page({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <LandingPage locale={locale} />;
}
