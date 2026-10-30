import { notFound } from "next/navigation";
import { CreateDocumentPage } from "@/features/documents/create-document-page";
import { isLocale } from "@/i18n/config";

export default async function Page({ params }: PageProps<"/[locale]/app/documents/new">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <CreateDocumentPage locale={locale} />;
}
