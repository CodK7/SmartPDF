import { describe, expect, it } from "vitest";
import { createDocument } from "./defaults";
import { currencyExponent, formatMoney, rescaleAmounts } from "./money";

describe("currency minor units", () => {
  it("uses the currency's own decimals", () => {
    expect(currencyExponent("OMR")).toBe(3);
    expect(currencyExponent("AED")).toBe(2);
    expect(currencyExponent("SAR")).toBe(2);
    expect(currencyExponent("USD")).toBe(2);
    expect(currencyExponent("not a currency")).toBe(2);
  });

  it("formats OMR with three decimals and AED/SAR with two", () => {
    expect(formatMoney(12_345, "OMR", "en")).toMatch(/12\.345/);
    expect(formatMoney(12_345, "AED", "en")).toMatch(/123\.45/);
    expect(formatMoney(12_345, "SAR", "en")).toMatch(/123\.45/);
  });

  it("keeps the displayed amount when the currency scale changes", () => {
    const invoice = createDocument("invoice", "en");
    invoice.content.lineItems[0]!.unitPriceMinor = 12_345;
    invoice.content.discountMinor = 500;
    const toOmr = rescaleAmounts(invoice.content, 2, 3);
    expect(toOmr.lineItems[0]!.unitPriceMinor).toBe(123_450);
    expect(toOmr.discountMinor).toBe(5_000);
    expect(rescaleAmounts(toOmr, 3, 2).lineItems[0]!.unitPriceMinor).toBe(12_345);
    expect(rescaleAmounts(invoice.content, 2, 2)).toBe(invoice.content);
  });
});
