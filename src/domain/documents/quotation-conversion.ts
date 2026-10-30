import type { InvoiceDocument, QuotationDocument } from "./types";

/** Internal conversion seam for a future accepted-quotation action. Not exposed in the UI yet. */
export function invoiceDraftFromQuotation(quotation: QuotationDocument): InvoiceDocument {
  const source = quotation.content;
  const sharedContent = {
    issuer: structuredClone(source.issuer), client: structuredClone(source.client),
    number: source.number, issueDate: source.issueDate, dueDate: source.dueDate,
    currency: source.currency, lineItems: structuredClone(source.lineItems),
    taxRate: source.taxRate, discountMinor: source.discountMinor, notes: source.notes,
  };
  const now = new Date().toISOString();
  return {
    ...quotation,
    id: crypto.randomUUID(),
    kind: "invoice",
    title: quotation.locale === "ar" ? "فاتورة من عرض سعر" : "Invoice from quotation",
    content: { ...sharedContent, number: "", dueDate: "" },
    revision: 0,
    createdAt: now,
    updatedAt: now,
  };
}
