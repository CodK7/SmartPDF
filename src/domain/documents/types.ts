export const documentKinds = ["cv", "invoice", "quotation"] as const;
export const locales = ["en", "ar"] as const;

export type DocumentKind = (typeof documentKinds)[number];
export type Locale = (typeof locales)[number];
export type Direction = "ltr" | "rtl";
export type DocumentStatus = "draft" | "ready" | "archived";

export interface CvExperience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface CvEducation {
  id: string;
  institution: string;
  degree: string;
  startDate: string;
  endDate: string;
}

export interface CvContent {
  profilePhotoDataUrl: string;
  fullName: string;
  headline: string;
  specialization: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  experiences: CvExperience[];
  education: CvEducation[];
  skills: string[];
}

export interface Party {
  name: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPriceMinor: number;
}

export interface BusinessContent {
  issuer: Party;
  client: Party;
  number: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  lineItems: LineItem[];
  taxRate: number;
  discountMinor: number;
  notes: string;
}

export type InvoiceContent = BusinessContent;
export type QuotationContent = BusinessContent & { validUntil: string; terms: string };

interface DocumentBase<K extends DocumentKind, C> {
  id: string;
  ownerId: "local";
  kind: K;
  schemaVersion: 1;
  title: string;
  status: DocumentStatus;
  templateId: string;
  locale: Locale;
  direction: Direction;
  paper: "A4" | "LETTER";
  content: C;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export type CvDocument = DocumentBase<"cv", CvContent>;
export type InvoiceDocument = DocumentBase<"invoice", InvoiceContent>;
export type QuotationDocument = DocumentBase<"quotation", QuotationContent>;
export type SmartDocument = CvDocument | InvoiceDocument | QuotationDocument;

export interface PreflightIssue {
  code: string;
  field: string;
  severity: "error" | "warning";
  message: string;
}
