// zod/mini keeps the browser bundle small; this module is shared with the export route.
import * as z from "zod/mini";
import { isCanonicalProfilePhotoDataUrl } from "@/security/image-validation";
import { isSafeDocumentText } from "@/security/text-validation";
import { directionForLocale } from "./types";

const safeText = (max: number) => z.string().check(
  z.trim(),
  z.maxLength(max),
  z.refine(isSafeDocumentText, "Invalid Unicode text"),
  z.overwrite((value) => value.normalize("NFC")),
);
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

const calendarDateText = z.string().check(z.trim(), z.maxLength(10), z.refine(isCalendarDate, "Invalid calendar date"));
const monthYearText = z.union([z.literal(""), z.string().check(z.regex(/^\d{4}-(0[1-9]|1[0-2])$/))]);
const profilePhotoDataUrl = z._default(z.union([
  z.literal(""),
  z.string().check(z.maxLength(300_000), z.refine(isCanonicalProfilePhotoDataUrl, "Invalid cropped profile photo")),
]), "");
const optionalEmail = z.union([z.literal(""), z.email().check(z.maxLength(254))]);

const partySchema = z.object({
  name: shortText,
  email: optionalEmail,
  phone: shortText,
  address: safeText(500),
  taxId: identifier,
});

const lineItemSchema = z.object({
  id: z.uuid(),
  description: safeText(500),
  quantity: z.number().check(z.positive(), z.lte(100_000), z.multipleOf(0.01)),
  unitPriceMinor: z.int().check(z.nonnegative(), z.lte(450_000_000)),
});

const businessContentSchema = z.object({
  issuer: partySchema,
  client: partySchema,
  number: identifier,
  issueDate: calendarDateText,
  dueDate: calendarDateText,
  currency: z.string().check(z.regex(/^[A-Z]{3}$/)),
  lineItems: z.array(lineItemSchema).check(z.minLength(1), z.maxLength(100)),
  taxRate: z.number().check(z.gte(0), z.lte(100), z.multipleOf(0.01)),
  discountMinor: z.int().check(z.nonnegative(), z.lte(1_000_000_000_000)),
  notes: longText,
});

const cvContentSchema = z.object({
  profilePhotoDataUrl,
  fullName: shortText,
  headline: shortText,
  specialization: z._default(shortText, ""),
  email: optionalEmail,
  phone: shortText,
  location: shortText,
  summary: longText,
  experiences: z.array(z.object({
    id: z.uuid(), company: shortText, role: shortText,
    startDate: monthYearText, endDate: monthYearText, current: z.boolean(),
    bullets: z.array(safeText(500)).check(z.maxLength(12)),
  })).check(z.maxLength(30)),
  education: z.array(z.object({
    id: z.uuid(), institution: shortText, degree: shortText,
    startDate: monthYearText, endDate: monthYearText,
  })).check(z.maxLength(20)),
  skills: z.array(shortText).check(z.maxLength(80)),
});

const base = {
  id: z.uuid(), ownerId: z.literal("local"), schemaVersion: z.literal(1),
  title: z.pipe(safeText(120), z.string().check(z.minLength(1))),
  status: z.enum(["draft", "ready", "archived"]),
  templateId: identifier, locale: z.enum(["en", "ar"]),
  direction: z.enum(["ltr", "rtl"]), paper: z.enum(["A4", "LETTER"]),
  revision: z.int().check(z.nonnegative()),
  createdAt: z.iso.datetime(), updatedAt: z.iso.datetime(),
};

export const cvDocumentSchema = z.object({ ...base, kind: z.literal("cv"), content: cvContentSchema });
export const invoiceDocumentSchema = z.object({ ...base, kind: z.literal("invoice"), content: businessContentSchema });
export const quotationDocumentSchema = z.object({
  ...base,
  kind: z.literal("quotation"),
  content: z.extend(businessContentSchema, { validUntil: calendarDateText, terms: longText }),
});

export const smartDocumentSchema = z.discriminatedUnion("kind", [
  cvDocumentSchema,
  invoiceDocumentSchema,
  quotationDocumentSchema,
]).check(z.refine((document) => document.direction === directionForLocale(document.locale), { path: ["direction"], error: "Direction must match locale" }));

// Drafts are stored with structural validation only, so one temporarily invalid
// field never blocks saving the rest. Strict validation runs at export.
const draftText = (max = 20_000) => z.string().check(z.maxLength(max));
const draftParty = z.object({ name: draftText(), email: draftText(), phone: draftText(), address: draftText(), taxId: draftText() });
const draftBusinessContent = z.object({
  issuer: draftParty, client: draftParty,
  number: draftText(), issueDate: draftText(10), dueDate: draftText(10), currency: draftText(10),
  lineItems: z.array(z.object({
    id: z.uuid(), description: draftText(), quantity: z.number(), unitPriceMinor: z.number(),
  })).check(z.maxLength(100)),
  taxRate: z.number(), discountMinor: z.number(), notes: draftText(),
});
const draftCvContent = z.object({
  profilePhotoDataUrl: z.catch(profilePhotoDataUrl, ""),
  fullName: draftText(), headline: draftText(), specialization: z._default(draftText(), ""),
  email: draftText(), phone: draftText(), location: draftText(), summary: draftText(),
  experiences: z.array(z.object({
    id: z.uuid(), company: draftText(), role: draftText(),
    startDate: draftText(10), endDate: draftText(10), current: z.boolean(), bullets: z.array(draftText()).check(z.maxLength(12)),
  })).check(z.maxLength(30)),
  education: z.array(z.object({
    id: z.uuid(), institution: draftText(), degree: draftText(), startDate: draftText(10), endDate: draftText(10),
  })).check(z.maxLength(20)),
  skills: z.array(draftText()).check(z.maxLength(80)),
});
const draftBase = { ...base, title: draftText(120), templateId: draftText(80) };

export const draftDocumentSchema = z.pipe(
  z.discriminatedUnion("kind", [
    z.object({ ...draftBase, kind: z.literal("cv"), content: draftCvContent }),
    z.object({ ...draftBase, kind: z.literal("invoice"), content: draftBusinessContent }),
    z.object({ ...draftBase, kind: z.literal("quotation"), content: z.extend(draftBusinessContent, { validUntil: draftText(10), terms: draftText() }) }),
  ]),
  z.transform((document) => ({ ...document, direction: directionForLocale(document.locale) })),
);
