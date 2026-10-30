import { z } from "zod";
import { isCanonicalProfilePhotoDataUrl } from "@/security/image-validation";
import { isSafeDocumentText } from "@/security/text-validation";

const safeText = (max: number) => z.string().trim().max(max).refine(isSafeDocumentText, "Invalid Unicode text").transform((value) => value.normalize("NFC"));
const shortText = safeText(160);
const longText = safeText(5_000);
const identifier = safeText(80);
function isCalendarDate(value: string) {
  if (value === "") return true;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

const calendarDateText = z.string().trim().max(10).refine(isCalendarDate, "Invalid calendar date");
const monthYearText = z.union([z.literal(""), z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)]);
const profilePhotoDataUrl = z.union([
  z.literal(""),
  z.string().max(300_000).refine(isCanonicalProfilePhotoDataUrl, "Invalid cropped profile photo"),
]).default("");

const partySchema = z.object({
  name: shortText,
  email: z.union([z.literal(""), z.email().max(254)]),
  phone: shortText,
  address: z.string().trim().max(500),
  taxId: identifier,
});

const lineItemSchema = z.object({
  id: z.uuid(),
  description: z.string().trim().max(500),
  quantity: z.number().finite().positive().max(100_000).multipleOf(0.01),
  unitPriceMinor: z.number().int().nonnegative().max(450_000_000),
});

const businessContentSchema = z.object({
  issuer: partySchema,
  client: partySchema,
  number: identifier,
  issueDate: calendarDateText,
  dueDate: calendarDateText,
  currency: z.string().regex(/^[A-Z]{3}$/),
  lineItems: z.array(lineItemSchema).min(1).max(100),
  taxRate: z.number().finite().min(0).max(100).multipleOf(0.01),
  discountMinor: z.number().int().nonnegative().max(1_000_000_000_000),
  notes: longText,
});

const cvContentSchema = z.object({
  profilePhotoDataUrl,
  fullName: shortText,
  headline: shortText,
  specialization: shortText.default(""),
  email: z.union([z.literal(""), z.email().max(254)]),
  phone: shortText,
  location: shortText,
  summary: longText,
  experiences: z.array(z.object({
    id: z.uuid(), company: shortText, role: shortText,
    startDate: monthYearText, endDate: monthYearText, current: z.boolean(),
    bullets: z.array(z.string().trim().max(500)).max(12),
  })).max(30),
  education: z.array(z.object({
    id: z.uuid(), institution: shortText, degree: shortText,
    startDate: monthYearText, endDate: monthYearText,
  })).max(20),
  skills: z.array(shortText).max(80),
});

const base = {
  id: z.uuid(), ownerId: z.literal("local"), schemaVersion: z.literal(1),
  title: safeText(120).pipe(z.string().min(1)),
  status: z.enum(["draft", "ready", "archived"]),
  templateId: identifier, locale: z.enum(["en", "ar"]),
  direction: z.enum(["ltr", "rtl"]), paper: z.enum(["A4", "LETTER"]),
  revision: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(), updatedAt: z.iso.datetime(),
};

export const cvDocumentSchema = z.object({ ...base, kind: z.literal("cv"), content: cvContentSchema });
export const invoiceDocumentSchema = z.object({ ...base, kind: z.literal("invoice"), content: businessContentSchema });
export const quotationDocumentSchema = z.object({
  ...base,
  kind: z.literal("quotation"),
  content: businessContentSchema.extend({ validUntil: calendarDateText, terms: longText }),
});

export const smartDocumentSchema = z.discriminatedUnion("kind", [
  cvDocumentSchema,
  invoiceDocumentSchema,
  quotationDocumentSchema,
]);
