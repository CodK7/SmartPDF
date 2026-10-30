import { describe, expect, it } from "vitest";
import { documentDefinitionFor, templates, templateText } from "@/document-engine/registry";
import { createDocument } from "./defaults";
import { calculateTotals } from "./money";
import { preflight } from "./preflight";
import { smartDocumentSchema } from "./schema";

describe("document engine", () => {
  it.each(["cv", "invoice", "quotation"] as const)("creates a valid %s document", (kind) => {
    expect(smartDocumentSchema.safeParse(createDocument(kind, "en")).success).toBe(true);
  });

  it("calculates discounts before tax using integer minor units", () => {
    const invoice = createDocument("invoice", "en");
    invoice.content.lineItems = [{ id: crypto.randomUUID(), description: "Service", quantity: 2, unitPriceMinor: 5_000 }];
    invoice.content.discountMinor = 1_000;
    invoice.content.taxRate = 10;
    expect(calculateTotals(invoice.content)).toEqual({ subtotalMinor: 10_000, taxMinor: 900, totalMinor: 9_900 });
  });

  it("blocks an empty business document from export", () => {
    const errors = preflight(createDocument("invoice", "ar")).filter(({ severity }) => severity === "error");
    expect(errors.map(({ code }) => code)).toEqual(expect.arrayContaining(["ISSUER_REQUIRED", "CLIENT_REQUIRED", "TOTAL_REQUIRED"]));
    expect(errors.every(({ message }) => !/[A-Za-z]/.test(message))).toBe(true);
  });

  it("provides Arabic document and template copy", () => {
    expect(documentDefinitionFor("cv", "ar")).toMatchObject({ name: "السيرة الذاتية" });
    expect(templates.every((template) => !/[A-Za-z]/.test(templateText(template, "ar").name))).toBe(true);
  });

  it("rejects untrusted oversized content", () => {
    const document = createDocument("cv", "en");
    document.content.summary = "x".repeat(5_001);
    expect(smartDocumentSchema.safeParse(document).success).toBe(false);
  });

  it("rejects malformed business dates and out-of-range numeric values", () => {
    const invoice = createDocument("invoice", "en");
    invoice.content.issueDate = "09/10/2026";
    invoice.content.taxRate = 101;
    expect(smartDocumentSchema.safeParse(invoice).success).toBe(false);
  });

  it("calculates maximum accepted business totals exactly", () => {
    const invoice = createDocument("invoice", "en");
    invoice.content.lineItems = Array.from({ length: 100 }, () => ({
      id: crypto.randomUUID(), description: "High-value service", quantity: 100_000, unitPriceMinor: 450_000_000,
    }));
    invoice.content.taxRate = 100;

    expect(smartDocumentSchema.safeParse(invoice).success).toBe(true);
    expect(calculateTotals(invoice.content)).toEqual({
      subtotalMinor: 4_500_000_000_000_000,
      taxMinor: 4_500_000_000_000_000,
      totalMinor: 9_000_000_000_000_000,
    });
    expect(Number.isSafeInteger(calculateTotals(invoice.content).totalMinor)).toBe(true);
  });

  it("rejects values from the former unsafe-integer exploit", () => {
    const invoice = createDocument("invoice", "en");
    invoice.content.lineItems[0] = {
      ...invoice.content.lineItems[0]!, quantity: 999_999, unitPriceMinor: 999_999_999_999,
    };
    expect(smartDocumentSchema.safeParse(invoice).success).toBe(false);
  });

  it("rejects calendar dates that do not exist", () => {
    const invoice = createDocument("invoice", "en");
    invoice.content.issueDate = "2026-02-31";
    expect(smartDocumentSchema.safeParse(invoice).success).toBe(false);
  });

  it("blocks invalid email addresses and business date order before export", () => {
    const invoice = createDocument("invoice", "en");
    invoice.content.issuer.name = "Northwind";
    invoice.content.issuer.email = "invalid-address";
    invoice.content.client.name = "Contoso";
    invoice.content.number = "INV-1";
    invoice.content.issueDate = "2026-10-10";
    invoice.content.dueDate = "2026-09-10";
    invoice.content.lineItems[0] = { ...invoice.content.lineItems[0]!, description: "Consulting", unitPriceMinor: 10_000 };

    expect(preflight(invoice).map(({ code }) => code)).toEqual(expect.arrayContaining([
      "ISSUER_EMAIL_INVALID",
      "DATE_ORDER_INVALID",
    ]));
  });

  it("treats whitespace-only required values as empty", () => {
    const cv = createDocument("cv", "en");
    cv.content.fullName = "   ";
    cv.content.headline = "\t";
    cv.content.email = "person@example.com";
    expect(preflight(cv).map(({ code }) => code)).toEqual(expect.arrayContaining([
      "CV_NAME_REQUIRED",
      "CV_HEADLINE_REQUIRED",
    ]));
  });

  it("rejects malformed Unicode and bidi controls but accepts Arabic and emoji", () => {
    for (const unsafeTitle of ["broken\ud800", "broken\udc00", "null\u0000", "spoof\u202Epdf"]) {
      const document = createDocument("cv", "en");
      document.title = unsafeTitle;
      expect(smartDocumentSchema.safeParse(document).success).toBe(false);
    }
    const valid = createDocument("cv", "en");
    valid.title = "السيرة الذاتية 👨‍💻";
    expect(smartDocumentSchema.safeParse(valid).success).toBe(true);
  });

  it("safely supplies the new specialization field for existing local CV drafts", () => {
    const legacy = structuredClone(createDocument("cv", "ar")) as unknown as { content: Record<string, unknown> };
    delete legacy.content.specialization;
    const parsed = smartDocumentSchema.safeParse(legacy);
    expect(parsed.success).toBe(true);
    if (parsed.success && parsed.data.kind === "cv") expect(parsed.data.content.specialization).toBe("");
  });
});
