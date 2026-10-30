import type { BusinessContent, LineItem } from "./types";

const QUANTITY_SCALE = BigInt(100);
const RATE_SCALE = BigInt(10_000);

export function lineItemTotal(item: LineItem): number {
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

export function formatMoney(minor: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(minor / 100);
}
