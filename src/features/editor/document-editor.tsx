"use client";

import { ArrowLeft, DownloadSimple, Eye, MagnifyingGlassMinus, MagnifyingGlassPlus, PencilSimple } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/design-system/components/button";
import { toast } from "@/design-system/components/toast";
import { documentEngine } from "@/document-engine/registry";
import { smartDocumentSchema } from "@/domain/documents/schema";
import type { Locale, SmartDocument } from "@/domain/documents/types";
import { useWorkspaceStore } from "@/features/documents/workspace-store";
import type { SaveState } from "./autosave";
import { DocumentPreview } from "@/features/preview/document-preview";
import { BusinessForm } from "./business-form";
import { CvForm } from "./cv-form";

const ZOOM_STEPS = [1, 1.5, 2, 3] as const;

function blockingMessages(document: SmartDocument, ar: boolean): string[] {
  const errors = documentEngine.preflight(document).filter(({ severity }) => severity === "error").map(({ message }) => message);
  if (errors.length) return errors;
  return smartDocumentSchema.safeParse(document).success ? [] : [ar ? "بعض الحقول تحتوي على قيم غير صالحة. راجع الحقول ثم حاول مرة أخرى." : "Some fields contain invalid values. Review the fields and try again."];
}

class ExportRequestError extends Error {
  constructor(readonly status: number) {
    super("EXPORT_REQUEST_FAILED");
    this.name = "ExportRequestError";
  }
}

export function DocumentEditor({ id, locale }: { id: string; locale: Locale }) {
  const { activeDocument, loading, error, saveState, openDocument, updateActive } = useWorkspaceStore();
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [issues, setIssues] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);
  const [zoom, setZoom] = useState<number>(1);
  const exportingRef = useRef(false);
  const ar = locale === "ar";
  useEffect(() => { void openDocument(id); }, [id, openDocument]);
  if (loading) return <EditorLoading locale={locale} />;
  if (error || !activeDocument) return <EditorMissing locale={locale} />;
  const document = activeDocument;
  const update = (next: SmartDocument) => {
    updateActive(() => next);
    if (issues.length) setIssues(blockingMessages(next, ar));
  };
  const switchMode = (next: "edit" | "preview") => {
    setMode(next);
    if (typeof window.scrollTo === "function") window.scrollTo({ top: 0 });
  };
  const zoomBy = (direction: 1 | -1) => setZoom((current) => ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, Math.max(0, ZOOM_STEPS.indexOf(current as (typeof ZOOM_STEPS)[number]) + direction))] ?? 1);

  async function exportPdf() {
    if (exportingRef.current) return;
    const blocking = blockingMessages(document, ar);
    if (blocking.length) { setIssues(blocking); toast.error(ar ? "أكمل الحقول المطلوبة قبل التصدير" : "Complete required fields before export"); return; }
    exportingRef.current = true;
    setExporting(true);
    try {
      const response = await fetch("/api/export", { method: "POST", headers: { "content-type": "application/json", "x-smartpdf-request": "1" }, body: JSON.stringify(document) });
      if (!response.ok) throw new ExportRequestError(response.status);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      const safeTitle = document.title.trim().replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-").slice(0, 80) || "SmartPDF";
      anchor.href = url;
      anchor.download = safeTitle + ".pdf";
      anchor.click();
      URL.revokeObjectURL(url);
      setIssues([]);
      toast.success(ar ? "تم تنزيل ملف PDF" : "PDF downloaded");
    } catch (error) {
      const message = error instanceof ExportRequestError && error.status === 429
        ? (ar ? "خدمة التصدير مشغولة الآن. حاول مرة أخرى بعد قليل." : "PDF export is busy. Please try again shortly.")
        : error instanceof ExportRequestError && error.status === 503
          ? (ar ? "خدمة تصدير PDF غير متاحة مؤقتًا. حاول لاحقًا." : "PDF export is temporarily unavailable. Please try again later.")
          : (ar ? "تعذر تصدير PDF. تحقق من البيانات وحاول مرة أخرى." : "Could not export PDF. Check the document and try again.");
      toast.error(message);
    }
    finally { exportingRef.current = false; setExporting(false); }
  }

  return <main id="main-content" className="editor-shell print-root min-h-dvh">
    <header className="no-print sticky top-0 z-40 flex min-h-16 flex-wrap items-center gap-3 border-b border-[var(--color-border)] bg-white px-4 py-2 lg:px-6 min-[1152px]:static"><Link href={`/${locale}/app`} className="focus-ring motion-control grid size-11 place-items-center rounded-lg hover:bg-[var(--color-surface-subtle)]" aria-label={ar ? "العودة للمستندات" : "Back to documents"}><ArrowLeft className="rtl:rotate-180" size={20} /></Link><input aria-label={ar ? "عنوان المستند" : "Document title"} className="motion-color min-w-0 flex-1 rounded-lg border-0 px-2 py-2 text-base font-bold outline-none focus:ring-2 focus:ring-[var(--color-focus)] sm:max-w-sm" value={document.title} maxLength={120} onChange={(event) => update({ ...document, title: event.target.value })} /><SaveStatus state={saveState} ar={ar} /><Button aria-busy={exporting} onClick={() => void exportPdf()} disabled={exporting}><DownloadSimple size={19} /><span aria-live="polite">{exporting ? (ar ? "جارٍ التصدير…" : "Exporting…") : (ar ? "تصدير PDF" : "Export PDF")}</span></Button></header>
    {issues.length ? <div className="no-print motion-state-entry mx-auto mt-4 max-w-4xl rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert"><p className="font-bold">{ar ? "أكمل ما يلي:" : "Complete the following:"}</p><ul className="mt-2 list-disc ps-5">{issues.map((message) => <li key={message}>{message}</li>)}</ul></div> : null}
    <div className="no-print sticky top-16 z-30 grid grid-cols-2 border-b border-[var(--color-border)] bg-white p-2 min-[1152px]:hidden" role="tablist" aria-label={ar ? "عرض المحرر" : "Editor view"}><button id="edit-tab" role="tab" aria-selected={mode === "edit"} aria-controls="editor-form" className={`focus-ring motion-state min-h-11 rounded-lg text-sm font-semibold ${mode === "edit" ? "bg-[var(--color-action-soft)] text-[var(--color-action)]" : "text-[var(--color-text-secondary)]"}`} onClick={() => switchMode("edit")}><PencilSimple className="me-2 inline" aria-hidden="true" />{ar ? "تحرير" : "Edit"}</button><button id="preview-tab" role="tab" aria-selected={mode === "preview"} aria-controls="editor-preview" className={`focus-ring motion-state min-h-11 rounded-lg text-sm font-semibold ${mode === "preview" ? "bg-[var(--color-action-soft)] text-[var(--color-action)]" : "text-[var(--color-text-secondary)]"}`} onClick={() => switchMode("preview")}><Eye className="me-2 inline" aria-hidden="true" />{ar ? "معاينة" : "Preview"}</button></div>
    {mode === "preview" ? <div className="no-print flex items-center justify-end gap-1 border-b border-[var(--color-border)] bg-white px-3 py-1 min-[1152px]:hidden" role="group" aria-label={ar ? "تكبير المعاينة" : "Preview zoom"}><button type="button" className="focus-ring motion-control grid size-11 place-items-center rounded-lg hover:bg-[var(--color-surface-subtle)] disabled:opacity-40" aria-label={ar ? "تصغير" : "Zoom out"} disabled={zoom === ZOOM_STEPS[0]} onClick={() => zoomBy(-1)}><MagnifyingGlassMinus size={20} aria-hidden="true" /></button><span className="min-w-12 text-center text-sm font-semibold tabular-nums" aria-live="polite">{Math.round(zoom * 100)}%</span><button type="button" className="focus-ring motion-control grid size-11 place-items-center rounded-lg hover:bg-[var(--color-surface-subtle)] disabled:opacity-40" aria-label={ar ? "تكبير" : "Zoom in"} disabled={zoom === ZOOM_STEPS[ZOOM_STEPS.length - 1]} onClick={() => zoomBy(1)}><MagnifyingGlassPlus size={20} aria-hidden="true" /></button></div> : null}
    <div className="grid min-[1152px]:h-[calc(100dvh-64px)] min-[1152px]:grid-cols-[380px_minmax(0,1fr)] min-[1152px]:overflow-hidden"><section id="editor-form" role="tabpanel" aria-labelledby="edit-tab" aria-label={ar ? "حقول المستند" : "Document fields"} tabIndex={0} className={`no-print relative overflow-y-auto overscroll-contain border-e border-[var(--color-border)] bg-white p-5 sm:p-7 ${mode === "preview" ? "hidden min-[1152px]:block" : "block"}`}>{document.kind === "cv" ? <CvForm document={document} locale={locale} update={update} /> : <BusinessForm document={document} locale={locale} update={update} />}</section><section id="editor-preview" role="tabpanel" aria-labelledby="preview-tab" aria-label={ar ? "معاينة المستند" : "Document preview"} tabIndex={0} className={`print-root min-h-[calc(100dvh-64px)] overflow-auto overscroll-contain bg-slate-200 p-2 sm:p-8 min-[1152px]:min-h-0 ${mode === "edit" ? "hidden min-[1152px]:flex" : "flex"}`}><DocumentPreview document={document} zoom={zoom} /></section></div>
  </main>;
}

function SaveStatus({ state, ar }: { state: SaveState; ar: boolean }) {
  const label = state === "saving" ? (ar ? "جارٍ الحفظ…" : "Saving…") : state === "error" ? (ar ? "فشل الحفظ" : "Save failed") : (ar ? "تم الحفظ" : "Saved");
  return <span role="status" data-save-state={state} className={`text-xs font-semibold ${state === "error" ? "text-red-700" : "text-[var(--color-text-secondary)]"}`}>{label}</span>;
}

function EditorLoading({ locale }: { locale: Locale }) { return <div className="motion-skeleton grid min-h-dvh min-[1152px]:grid-cols-[380px_1fr]" aria-label={locale === "ar" ? "جارٍ تحميل المحرر" : "Loading editor"}><div className="bg-white p-8"><div className="h-7 w-2/3 rounded bg-slate-200" /><div className="mt-8 space-y-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-12 rounded bg-slate-100" />)}</div></div><div className="grid place-items-center bg-slate-200"><div className="aspect-[210/297] h-[70dvh] bg-white" /></div></div>; }
function EditorMissing({ locale }: { locale: Locale }) { return <div className="grid min-h-[70dvh] place-items-center p-6"><div className="surface rounded-xl p-8 text-center"><h1 className="text-2xl font-bold">{locale === "ar" ? "المستند غير موجود" : "Document not found"}</h1><Link href={`/${locale}/app`} className="focus-ring mt-5 inline-flex min-h-11 items-center rounded-lg bg-[var(--color-action)] px-4 font-semibold text-white">{locale === "ar" ? "العودة للمستندات" : "Back to documents"}</Link></div></div>; }
