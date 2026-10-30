"use client";

import { FilePlus, FileText, Invoice, Quotes, Trash } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/design-system/components/button";
import { toast } from "@/design-system/components/toast";
import type { DocumentKind, Locale } from "@/domain/documents/types";
import { useWorkspaceStore } from "./workspace-store";

const copy = {
  en: {
    title: "Your document workspace", subtitle: "Create, continue, and export professional documents.", new: "New document",
    recent: "Recent documents", emptyTitle: "No documents yet.", open: "Open", remove: "Delete",
    removed: "Document deleted", loadError: "Could not access documents stored in this browser.", retry: "Try again",
  },
  ar: {
    title: "مساحة عمل مستنداتك", subtitle: "أنشئ مستنداتك الاحترافية وتابعها وصدّرها.", new: "مستند جديد",
    recent: "المستندات الأخيرة", emptyTitle: "لا توجد مستندات بعد.", open: "فتح", remove: "حذف",
    removed: "تم حذف المستند", loadError: "تعذر الوصول إلى المستندات المحفوظة في هذا المتصفح.", retry: "حاول مرة أخرى",
  },
} as const;

const kindIcon: Record<DocumentKind, typeof FileText> = { cv: FileText, invoice: Invoice, quotation: Quotes };

export function DashboardPage({ locale }: { locale: Locale }) {
  const { documents, loading, error, hydrate, removeDocument } = useWorkspaceStore();
  const text = copy[locale];
  useEffect(() => { void hydrate(); }, [hydrate]);

  async function remove(id: string) {
    if (!window.confirm(locale === "ar" ? "حذف هذا المستند نهائيًا من هذا الجهاز؟" : "Delete this document from this device?")) return;
    await removeDocument(id);
    toast.success(text.removed);
  }

  return <main id="main-content" className="mx-auto min-h-dvh max-w-[1440px] px-4 pb-28 pt-10 sm:px-8 lg:px-10 lg:pb-12 lg:pt-12">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{text.title}</h1><p className="mt-2 text-[var(--color-text-secondary)]">{text.subtitle}</p></div><Link href={`/${locale}/app/documents/new`} className="focus-ring motion-control inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--color-action)] px-5 font-semibold text-white hover:bg-[var(--color-action-hover)]"><FilePlus size={20} aria-hidden="true" />{text.new}</Link></div>
    <section className="mt-12" aria-labelledby="recent-heading"><div className="mb-5 flex items-center gap-3"><h2 id="recent-heading" className="text-xl font-bold">{text.recent}</h2>{documents.length ? <span className="text-sm text-[var(--color-text-muted)]">{documents.length}</span> : null}</div>
      {loading ? <DocumentSkeletons locale={locale} /> : error ? <div role="alert" className="motion-state-entry rounded-xl border border-red-200 bg-red-50 p-5 text-red-800"><p>{text.loadError}</p><Button className="mt-4" variant="secondary" onClick={() => void hydrate()}>{text.retry}</Button></div> : documents.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{documents.map((document) => { const Icon = kindIcon[document.kind]; return <article key={document.id} className="surface motion-surface group rounded-xl p-5 hover:border-[var(--color-border-strong)]"><div className="flex items-start justify-between gap-4"><div className="grid size-10 place-items-center rounded-lg bg-[var(--color-action-soft)] text-[var(--color-action)]"><Icon size={21} aria-hidden="true" /></div><button aria-label={`${text.remove}: ${document.title}`} onClick={() => void remove(document.id)} className="focus-ring motion-control grid size-11 place-items-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"><Trash size={19} aria-hidden="true" /></button></div><h3 className="mt-5 truncate text-lg font-bold">{document.title}</h3><p className="mt-1 text-sm text-[var(--color-text-muted)]">{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(document.updatedAt))}</p><Link href={`/${locale}/app/documents/${document.id}`} className="focus-ring motion-control mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[var(--color-border-strong)] text-sm font-semibold hover:bg-[var(--color-surface-subtle)]">{text.open}</Link></article>; })}</div> : <div className="surface rounded-2xl p-8 text-center sm:p-14"><div className="mx-auto grid size-14 place-items-center rounded-xl bg-[var(--color-action-soft)] text-[var(--color-action)]"><FileText size={28} aria-hidden="true" /></div><h3 className="mt-5 text-xl font-bold">{text.emptyTitle}</h3></div>}
    </section>
  </main>;
}

function DocumentSkeletons({ locale }: { locale: Locale }) {
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label={locale === "ar" ? "جارٍ تحميل المستندات" : "Loading documents"}>{[1, 2, 3].map((item) => <div key={item} className="surface motion-skeleton h-52 rounded-xl p-5"><div className="size-10 rounded-lg bg-slate-200" /><div className="mt-6 h-5 w-2/3 rounded bg-slate-200" /><div className="mt-3 h-3 w-1/3 rounded bg-slate-100" /></div>)}</div>;
}
