import { notFound } from "next/navigation";
import { DocumentEditor } from "@/features/editor/document-editor";
import { isLocale } from "@/i18n/config";

export default async function Page({ params }: PageProps<"/[locale]/app/documents/[documentId]">) {
  const { locale, documentId } = await params;
  if (!isLocale(locale)) notFound();
  return <DocumentEditor id={documentId} locale={locale} />;
}
