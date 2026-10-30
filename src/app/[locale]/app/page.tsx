import { notFound } from "next/navigation";
import { DashboardPage } from "@/features/documents/dashboard-page";
import { isLocale } from "@/i18n/config";

export default async function Page({ params }: PageProps<"/[locale]/app">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <DashboardPage locale={locale} />;
}
