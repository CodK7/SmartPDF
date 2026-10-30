import { notFound } from "next/navigation";
import { WorkspaceShell } from "@/features/workspace/workspace-shell";
import { isLocale } from "@/i18n/config";

export default async function AppLayout({ children, params }: LayoutProps<"/[locale]/app">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <WorkspaceShell locale={locale}>{children}</WorkspaceShell>;
}
