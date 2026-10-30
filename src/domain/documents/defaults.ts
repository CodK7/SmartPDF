import type { CvDocument, DocumentKind, InvoiceDocument, Locale, Party, QuotationDocument, SmartDocument } from "./types";

const emptyParty = (): Party => ({ name: "", email: "", phone: "", address: "", taxId: "" });
const today = () => new Date().toISOString().slice(0, 10);

function metadata(kind: DocumentKind, locale: Locale) {
  const now = new Date().toISOString();
  const labels = locale === "ar"
    ? { cv: "سيرتي الذاتية", invoice: "فاتورة جديدة", quotation: "عرض سعر جديد" }
    : { cv: "My resume", invoice: "New invoice", quotation: "New quotation" };
  return {
    id: crypto.randomUUID(), ownerId: "local" as const, schemaVersion: 1 as const,
    title: labels[kind], status: "draft" as const, templateId: "signature",
    locale, direction: locale === "ar" ? "rtl" as const : "ltr" as const,
    paper: "A4" as const, revision: 0, createdAt: now, updatedAt: now,
  };
}

function businessContent() {
  return {
    issuer: emptyParty(), client: emptyParty(), number: "", issueDate: today(), dueDate: "",
    currency: "USD", lineItems: [{ id: crypto.randomUUID(), description: "", quantity: 1, unitPriceMinor: 0 }],
    taxRate: 0, discountMinor: 0, notes: "",
  };
}

export function createDocument(kind: "cv", locale: Locale): CvDocument;
export function createDocument(kind: "invoice", locale: Locale): InvoiceDocument;
export function createDocument(kind: "quotation", locale: Locale): QuotationDocument;
export function createDocument(kind: DocumentKind, locale: Locale): SmartDocument;
export function createDocument(kind: DocumentKind, locale: Locale): SmartDocument {
  const base = metadata(kind, locale);
  if (kind === "cv") {
    return { ...base, kind, content: {
      profilePhotoDataUrl: "", fullName: "", headline: "", specialization: "", email: "", phone: "", location: "", summary: "",
      experiences: [], education: [], skills: [],
    } };
  }
  if (kind === "invoice") return { ...base, kind, content: businessContent() };
  return { ...base, kind, content: { ...businessContent(), validUntil: "", terms: "" } };
}
