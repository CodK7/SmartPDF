import { calculateTotals } from "./money";
import type { PreflightIssue, SmartDocument } from "./types";

const issue = (code: string, field: string, message: string, severity: "error" | "warning" = "error"): PreflightIssue =>
  ({ code, field, message, severity });

const validationCopy = {
  en: {
    name: "Full name is required.", headline: "Professional headline is required.",
    contact: "Add an email or phone number.", summary: "A short summary improves the document.",
    email: "Enter a valid email address.", dateOrder: "The end date cannot be before the issue date.",
    issuer: "Issuer name is required.", client: "Client name is required.",
    number: "Document number is required.", item: "Every line item needs a description.",
    total: "The total must be greater than zero.", validity: "Quotation validity date is required.",
  },
  ar: {
    name: "الاسم الكامل مطلوب.", headline: "المسمى المهني مطلوب.",
    contact: "أضف بريدًا إلكترونيًا أو رقم هاتف.", summary: "إضافة نبذة مهنية قصيرة تحسّن المستند.",
    email: "أدخل بريدًا إلكترونيًا صالحًا.", dateOrder: "لا يمكن أن يسبق تاريخ الانتهاء تاريخ الإصدار.",
    issuer: "اسم الجهة المصدرة مطلوب.", client: "اسم العميل مطلوب.",
    number: "رقم المستند مطلوب.", item: "يجب إضافة وصف لكل بند.",
    total: "يجب أن يكون الإجمالي أكبر من صفر.", validity: "تاريخ صلاحية عرض السعر مطلوب.",
  },
} as const;

function isValidEmail(value: string) {
  return value === "" || (value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
}

function cvIssues(document: Extract<SmartDocument, { kind: "cv" }>): PreflightIssue[] {
  const { content } = document;
  const text = validationCopy[document.locale];
  const issues: PreflightIssue[] = [];
  if (!content.fullName.trim()) issues.push(issue("CV_NAME_REQUIRED", "content.fullName", text.name));
  if (!content.headline.trim()) issues.push(issue("CV_HEADLINE_REQUIRED", "content.headline", text.headline));
  if (!content.email.trim() && !content.phone.trim()) issues.push(issue("CV_CONTACT_REQUIRED", "content.email", text.contact));
  if (!isValidEmail(content.email.trim())) issues.push(issue("CV_EMAIL_INVALID", "content.email", text.email));
  if (!content.summary.trim()) issues.push(issue("CV_SUMMARY_EMPTY", "content.summary", text.summary, "warning"));
  return issues;
}

function businessIssues(document: Exclude<SmartDocument, { kind: "cv" }>): PreflightIssue[] {
  const { content } = document;
  const text = validationCopy[document.locale];
  const issues: PreflightIssue[] = [];
  if (!content.issuer.name.trim()) issues.push(issue("ISSUER_REQUIRED", "content.issuer.name", text.issuer));
  if (!content.client.name.trim()) issues.push(issue("CLIENT_REQUIRED", "content.client.name", text.client));
  if (!content.number.trim()) issues.push(issue("NUMBER_REQUIRED", "content.number", text.number));
  if (!isValidEmail(content.issuer.email.trim())) issues.push(issue("ISSUER_EMAIL_INVALID", "content.issuer.email", text.email));
  if (!isValidEmail(content.client.email.trim())) issues.push(issue("CLIENT_EMAIL_INVALID", "content.client.email", text.email));
  if (content.lineItems.some((item) => !item.description.trim())) issues.push(issue("ITEM_DESCRIPTION_REQUIRED", "content.lineItems", text.item));
  if (calculateTotals(content).totalMinor <= 0) issues.push(issue("TOTAL_REQUIRED", "content.lineItems", text.total));
  const endDate = document.kind === "quotation" ? document.content.validUntil : content.dueDate;
  if (content.issueDate && endDate && endDate < content.issueDate) issues.push(issue("DATE_ORDER_INVALID", document.kind === "quotation" ? "content.validUntil" : "content.dueDate", text.dateOrder));
  if (document.kind === "quotation" && !document.content.validUntil) {
    issues.push(issue("VALID_UNTIL_REQUIRED", "content.validUntil", text.validity));
  }
  return issues;
}

export function preflight(document: SmartDocument): PreflightIssue[] {
  return document.kind === "cv" ? cvIssues(document) : businessIssues(document);
}
