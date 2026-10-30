import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n/config";

export default async function Page({ params }: PageProps<"/[locale]/app/templates">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  redirect(`/${locale}/app/documents/new`);
}
