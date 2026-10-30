import { describe, expect, it } from "vitest";
import { createDocument } from "./defaults";
import { invoiceDraftFromQuotation } from "./quotation-conversion";

describe("quotation conversion seam", () => {
  it("preserves commercial data without carrying quotation-only fields", () => {
    const quotation = createDocument("quotation", "en");
    quotation.content.client.name = "Harbor & Cole";
    quotation.content.lineItems[0]!.description = "Operations consulting";
    quotation.content.validUntil = "2026-09-30";
    quotation.content.terms = "Valid for 30 days";

    const invoice = invoiceDraftFromQuotation(quotation);

    expect(invoice.kind).toBe("invoice");
    expect(invoice.content.client.name).toBe("Harbor & Cole");
    expect(invoice.content.lineItems[0]?.description).toBe("Operations consulting");
    expect(invoice.content).not.toHaveProperty("validUntil");
    expect(invoice.content).not.toHaveProperty("terms");
    expect(invoice.content.number).toBe("");
  });
});
