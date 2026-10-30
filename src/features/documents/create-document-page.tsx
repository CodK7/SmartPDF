"use client";

import { Check, FileText, Invoice } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/design-system/components/button";
import { documentDefinitionFor } from "@/document-engine/registry";
import type { DocumentKind, Locale } from "@/domain/documents/types";
import { useWorkspaceStore } from "./workspace-store";

type CreatableDocumentKind = Extract<DocumentKind, "cv" | "invoice">;
const creatableKinds: readonly CreatableDocumentKind[] = ["cv", "invoice"];
const icons: Record<CreatableDocumentKind, typeof FileText> = { cv: FileText, invoice: Invoice };
const languageOptions = [{ value: "en", label: "English" }, { value: "ar", label: "العربية" }] as const;
const labels = {
  en: {
    title: "Create Document",
    subtitleBefore: "Choose what you want to create. ", subtitleAfter: " handles the layout and formatting for you.",
    type: "Document type", language: "Document language",
    continue: "Create and Open Editor",
    creating: "Creating…",
  },
  ar: {
    title: "إنشاء مستند",
    subtitleBefore: "اختر نوع المستند، وسيتولى ", subtitleAfter: " التنسيق والترتيب تلقائيًا.",
    type: "نوع المستند", language: "لغة المستند",
    continue: "إنشاء وفتح المحرر",
    creating: "جارٍ الإنشاء…",
  },
} as const;

export function CreateDocumentPage({ locale }: { locale: Locale }) {
  const [kind, setKind] = useState<CreatableDocumentKind>("cv");
  const [documentLocale, setDocumentLocale] = useState<Locale>(locale);
  const [creating, setCreating] = useState(false);
  const creatingRef = useRef(false);
  const createDocument = useWorkspaceStore((state) => state.createDocument);
  const router = useRouter();
  const text = labels[locale];

  async function create() {
    if (creatingRef.current) return;
    creatingRef.current = true;
    setCreating(true);
    try {
      const document = await createDocument(kind, documentLocale, "signature");
      router.push(`/${locale}/app/documents/${document.id}`);
    } finally { creatingRef.current = false; setCreating(false); }
  }

  return <main id="main-content" className="mx-auto max-w-6xl px-4 pb-28 pt-12 sm:px-8 sm:pt-16 lg:pb-16 lg:pt-20">
    <header className="max-w-3xl"><h1 className="text-4xl font-bold leading-tight tracking-[-.025em] sm:text-5xl">{text.title}</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--color-text-secondary)]">{text.subtitleBefore}<span className="display-type font-semibold text-[var(--color-text)]" dir="ltr">SmartPDF</span>{text.subtitleAfter}</p></header>
      <fieldset className="mt-12"><legend className="text-lg font-bold">{text.type}</legend><div className="mt-5 grid gap-4 md:grid-cols-2">{creatableKinds.map((value) => { const definition = documentDefinitionFor(value, locale); const Icon = icons[value]; const selected = kind === value; return <label key={value} className={`motion-control relative cursor-pointer rounded-xl border p-6 focus-within:ring-2 focus-within:ring-[var(--color-focus)] focus-within:ring-offset-2 ${selected ? "border-[var(--color-action)] bg-[var(--color-action-soft)]" : "border-[var(--color-border)] bg-white hover:border-[var(--color-border-strong)]"}`}><input type="radio" name="kind" value={value} checked={selected} onChange={() => setKind(value)} className="sr-only" /><Icon size={26} className="text-[var(--color-action)]" aria-hidden="true" /><span className="mt-5 block text-lg font-bold">{definition.name}</span><span className="mt-2 block text-sm leading-6 text-[var(--color-text-secondary)]">{definition.description}</span><Check className={`motion-state absolute end-4 top-4 text-[var(--color-action)] ${selected ? "scale-100 opacity-100" : "scale-95 opacity-0"}`} aria-hidden="true" /></label>; })}</div></fieldset>
      <fieldset className="mt-10"><legend className="text-lg font-bold">{text.language}</legend><div className="mt-4 flex flex-wrap gap-3">{languageOptions.map(({ value, label }) => <label key={value} className={`motion-control cursor-pointer rounded-xl border px-5 py-3 text-sm font-semibold focus-within:ring-2 focus-within:ring-[var(--color-focus)] focus-within:ring-offset-2 ${documentLocale === value ? "border-[var(--color-action)] bg-[var(--color-action-soft)] text-[var(--color-action)]" : "border-[var(--color-border)] bg-white hover:border-[var(--color-border-strong)]"}`}><input type="radio" name="documentLocale" value={value} checked={documentLocale === value} onChange={() => setDocumentLocale(value)} className="sr-only" /><span lang={value}>{label}</span></label>)}</div></fieldset>
    <div className="mt-8 flex justify-end"><Button className="w-full px-6 sm:w-auto" onClick={() => void create()} disabled={creating}>{creating ? text.creating : text.continue}</Button></div>
  </main>;
}
