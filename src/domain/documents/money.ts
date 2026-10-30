import type { BusinessContent, LineItem } from "./types";

const QUANTITY_SCALE = BigInt(100);
const RATE_SCALE = BigInt(10_000);

function lineItemTotal(item: LineItem): number {
  const quantityHundredths = BigInt(Math.round(item.quantity * Number(QUANTITY_SCALE)));
  const exact = (quantityHundredths * BigInt(item.unitPriceMinor) + QUANTITY_SCALE / BigInt(2)) / QUANTITY_SCALE;
  return Number(exact);
}

export function calculateTotals(content: BusinessContent) {
  const subtotal = content.lineItems.reduce((sum, item) => sum + BigInt(lineItemTotal(item)), BigInt(0));
  const discounted = subtotal > BigInt(content.discountMinor) ? subtotal - BigInt(content.discountMinor) : BigInt(0);
  const taxBasisPoints = BigInt(Math.round(content.taxRate * 100));
  const tax = (discounted * taxBasisPoints + RATE_SCALE / BigInt(2)) / RATE_SCALE;
  return { subtotalMinor: Number(subtotal), taxMinor: Number(tax), totalMinor: Number(discounted + tax) };
}

// Minor units follow the currency's own decimals: 2 for USD/AED/SAR, 3 for OMR.
export function currencyExponent(currency: string): number {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

export function formatMoney(minor: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(minor / 10 ** currencyExponent(currency));
}

// Re-expresses stored amounts when the minor-unit scale changes (currency switch or v1 migration).
export function rescaleAmounts<T extends { lineItems: { unitPriceMinor: number }[]; discountMinor: number }>(content: T, fromExponent: number, toExponent: number): T {
  if (fromExponent === toExponent) return content;
  const factor = 10 ** (toExponent - fromExponent);
  const scale = (minor: number) => Math.round(minor * factor);
  return {
    ...content,
    lineItems: content.lineItems.map((item) => ({ ...item, unitPriceMinor: scale(item.unitPriceMinor) })),
    discountMinor: scale(content.discountMinor),
  };
}
