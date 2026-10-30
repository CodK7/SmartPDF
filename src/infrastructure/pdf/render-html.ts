import { calculateTotals, formatMoney } from "@/domain/documents/money";
import { cvAchievementLines, directionForText } from "@/domain/documents/cv-format";
import { CV_DOCUMENT_CSS } from "@/document-engine/cv-visual-spec";
import type { CvDocument, InvoiceDocument, Locale, QuotationDocument, SmartDocument } from "@/domain/documents/types";
import type { PdfFontAssets } from "./font-assets";

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

function formatMonth(value: string, locale: Locale) {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return escapeHtml(value);
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-US", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1)));
}

function dateRange(start: string, end: string, locale: Locale) {
  return [start, end].filter(Boolean).map((value) => formatMonth(value, locale)).join(" – ");
}

function section(title: string, content: string, cv = false) {
  const className = cv ? "cv-section" : "section";
  const titleClass = cv ? ' class="cv-display cv-section-title"' : "";
  return content ? '<section class="' + className + '"><h2' + titleClass + ">" + escapeHtml(title) + "</h2>" + content + "</section>" : "";
}

function renderCv(document: CvDocument) {
  const c = document.content;
  const ar = document.locale === "ar";
  const t = ar
    ? { name: "اسمك الكامل", headline: "المسمى المهني", specialization: "المجال المهني", profile: "نبذة مهنية", experience: "الخبرات", education: "التعليم", skills: "المهارات", present: "حتى الآن", role: "المسمى الوظيفي", company: "الشركة" }
    : { name: "Your name", headline: "Professional headline", specialization: "Professional field", profile: "Profile", experience: "Experience", education: "Education", skills: "Skills", present: "Present", role: "Role", company: "Company" };
  const contacts = [c.email, c.phone, c.location].filter(Boolean).map(escapeHtml).join(" · ") || "email@example.com · +000 000 000";
  const summary = c.summary ? '<p class="cv-body-copy" dir="auto">' + escapeHtml(c.summary) + "</p>" : "";
  const experiences = c.experiences.map((item) => {
    const bullets = cvAchievementLines(item.bullets).map((bullet) => '<li dir="' + directionForText(bullet, document.direction) + '">' + escapeHtml(bullet) + "</li>").join("");
    return '<article class="cv-entry"><div class="cv-entry-head"><div><h3 class="cv-entry-title" dir="auto">' + escapeHtml(item.role || t.role) + '</h3><p class="cv-entry-company" dir="auto">' + escapeHtml(item.company || t.company) + '</p></div><p class="cv-entry-date">' + dateRange(item.startDate, item.current ? t.present : item.endDate, document.locale) + "</p></div>" + (bullets ? '<ul class="cv-achievements">' + bullets + "</ul>" : "") + "</article>";
  }).join("");
  const education = c.education.map((item) => '<article class="cv-entry cv-entry-head"><div><h3 class="cv-entry-title" dir="auto">' + escapeHtml(item.degree) + '</h3><p class="cv-entry-school" dir="auto">' + escapeHtml(item.institution) + '</p></div><p class="cv-entry-date">' + dateRange(item.startDate, item.endDate, document.locale) + "</p></article>").join("");
  const skills = c.skills.filter(Boolean).map((skill) => '<span class="cv-skill" dir="auto">' + escapeHtml(skill) + "</span>").join("");
  const photo = c.profilePhotoDataUrl ? '<img class="cv-photo" alt="" src="' + escapeHtml(c.profilePhotoDataUrl) + '">' : "";
  return '<main class="cv-document ' + (document.templateId === "editorial" ? "editorial" : "professional") + '"><header class="cv-header"><div class="cv-identity">' + photo + '<div class="cv-identity-copy"><h1 class="cv-display cv-name" dir="auto">' + escapeHtml(c.fullName || t.name) + '</h1><p class="cv-headline" dir="auto">' + escapeHtml(c.headline || t.headline) + '</p><p class="cv-specialization" dir="auto">' + escapeHtml(c.specialization || t.specialization) + '</p></div></div><p class="cv-contacts" dir="auto">' + contacts + "</p></header>" + section(t.profile, summary, true) + section(t.experience, experiences, true) + section(t.education, education, true) + section(t.skills, skills ? '<div class="cv-skills">' + skills + "</div>" : "", true) + "</main>";
}

function renderBusiness(document: InvoiceDocument | QuotationDocument) {
  const c = document.content;
  const ar = document.locale === "ar";
  const t = ar
    ? { type: document.kind === "invoice" ? "فاتورة" : "عرض سعر", proposal: "عرض تجاري قبل الفاتورة", business: "اسم منشأتك", billTo: "العميل", preparedFor: "مقدم إلى", client: "اسم العميل", invoiceNumber: "رقم الفاتورة", quoteNumber: "رقم عرض السعر", issue: "تاريخ الإصدار", due: "تاريخ الاستحقاق", valid: "صالح حتى", description: "الوصف", itemService: "الخدمة / البند", qty: "الكمية", price: "السعر", amount: "المبلغ", subtotal: "المجموع الفرعي", discount: "الخصم", tax: "الضريبة", total: "الإجمالي", proposed: "إجمالي المبلغ المقترح", notes: "ملاحظات", terms: "الشروط والأحكام" }
    : { type: document.kind === "invoice" ? "INVOICE" : "QUOTATION", proposal: "Commercial proposal", business: "Your business", billTo: "Bill to", preparedFor: "Prepared for", client: "Client name", invoiceNumber: "Invoice number", quoteNumber: "Quote number", issue: "Issue date", due: "Due date", valid: "Valid until", description: "Description", itemService: "Item / service", qty: "Qty", price: "Price", amount: "Amount", subtotal: "Subtotal", discount: "Discount", tax: "Tax", total: "Total", proposed: "Total proposed amount", notes: "Notes", terms: "Terms / Conditions" };
  const locale = ar ? "ar-OM" : "en-US";
  const totals = calculateTotals(c);
  const rows = c.lineItems.map((item) => "<tr><td>" + escapeHtml(item.description) + "</td><td>" + item.quantity + "</td><td>" + escapeHtml(formatMoney(item.unitPriceMinor, c.currency, locale)) + "</td><td><strong>" + escapeHtml(formatMoney(Math.round(item.quantity * item.unitPriceMinor), c.currency, locale)) + "</strong></td></tr>").join("");
  const quotation = document.kind === "quotation";
  const metaEntries: Array<[string, string]> = [[t.issue, c.issueDate]];
  if (quotation) metaEntries.push([t.valid, document.content.validUntil]);
  else metaEntries.push([t.due, c.dueDate]);
  const meta = metaEntries.filter(([, value]) => value).map(([label, value]) => "<dt>" + escapeHtml(label) + "</dt><dd>" + escapeHtml(value) + "</dd>").join("");
  const totalsHtml = '<div class="totals"><p><span>' + t.subtotal + "</span><span>" + escapeHtml(formatMoney(totals.subtotalMinor, c.currency, locale)) + "</span></p>" + (c.discountMinor ? "<p><span>" + t.discount + "</span><span>−" + escapeHtml(formatMoney(c.discountMinor, c.currency, locale)) + "</span></p>" : "") + (c.taxRate ? "<p><span>" + t.tax + " (" + c.taxRate + "%)</span><span>" + escapeHtml(formatMoney(totals.taxMinor, c.currency, locale)) + "</span></p>" : "") + '<p class="grand"><span>' + (quotation ? t.proposed : t.total) + "</span><span>" + escapeHtml(formatMoney(totals.totalMinor, c.currency, locale)) + "</span></p></div>";
  const terms = document.kind === "quotation" && document.content.terms ? section(t.terms, '<p class="body-copy">' + escapeHtml(document.content.terms) + "</p>") : "";
  const notes = c.notes ? section(t.notes, '<p class="body-copy">' + escapeHtml(c.notes) + "</p>") : "";
  const proposal = quotation ? '<p class="proposal-label">' + t.proposal + "</p>" : "";
  const numberLabel = quotation ? t.quoteNumber : t.invoiceNumber;
  return '<main class="business ' + (quotation ? "quotation" : "invoice") + '"><header class="business-header"><div>' + proposal + "<h1>" + t.type + '</h1><p class="muted"><strong>' + numberLabel + "</strong> · " + escapeHtml(c.number || "—") + '</p></div><div class="issuer"><h2>' + escapeHtml(c.issuer.name || t.business) + '</h2><p>' + escapeHtml(c.issuer.address) + "</p><p>" + escapeHtml(c.issuer.email) + '</p></div></header><section class="business-meta"><div><span class="label">' + (quotation ? t.preparedFor : t.billTo) + "</span><h3>" + escapeHtml(c.client.name || t.client) + "</h3><p>" + escapeHtml(c.client.address) + "</p></div><dl>" + meta + '</dl></section><table><thead><tr><th>' + (quotation ? t.itemService : t.description) + "</th><th>" + t.qty + "</th><th>" + t.price + "</th><th>" + t.amount + "</th></tr></thead><tbody>" + rows + "</tbody></table>" + totalsHtml + terms + notes + "</main>";
}

function styles(fonts: PdfFontAssets) {
  return [
    "@font-face{font-family:SmartDisplay;src:url(data:font/woff2;base64,", fonts.displayLatin, ") format('woff2');font-weight:200 800}",
    "@font-face{font-family:SmartDisplayArabic;src:url(data:font/woff2;base64,", fonts.displayArabic, ") format('woff2');font-weight:700}",
    "@font-face{font-family:SmartBody;src:url(data:font/woff2;base64,", fonts.bodyLatin, ") format('woff2');font-weight:100 900}",
    "@font-face{font-family:SmartBody;src:url(data:font/woff2;base64,", fonts.bodyArabic, ") format('woff2');font-weight:100 900}",
    CV_DOCUMENT_CSS,
    "@page{size:A4;margin:18mm}*{box-sizing:border-box}html{background:#fff}body{margin:0;color:#0f172a;font-family:SmartBody,Arial,sans-serif;font-size:10.5pt;line-height:1.65;-webkit-print-color-adjust:exact;print-color-adjust:exact}main{width:100%}h1,h2{font-family:SmartDisplay,Georgia,serif}html[dir=rtl] h1,html[dir=rtl] h2{font-family:SmartDisplayArabic,SmartBody,serif}.cv-header{border-bottom:2px solid #1d4ed8;padding-bottom:6mm}.editorial .cv-header{border-bottom:0;border-inline-start:4px solid #1d4ed8;padding-inline-start:6mm}.cv-header h1{margin:0;font-size:25.5pt;line-height:1.1;font-weight:650}.headline{margin:2.5mm 0 0;color:#1d4ed8;font-size:13.5pt;font-weight:700}.specialization{margin:1mm 0 0;color:#475569;font-size:10pt;font-weight:600}.contacts{margin:3mm 0 0;color:#475569;font-size:9.5pt}.section{margin-top:7mm}.section>h2{margin:0 0 3mm;font-size:12pt;font-weight:700;break-after:avoid}.body-copy{margin:0;white-space:pre-wrap;color:#334155}.entry{margin:0 0 5mm;break-inside:avoid}.entry-head{display:flex;align-items:baseline;justify-content:space-between;gap:5mm}.entry h3{margin:0;font-size:11pt}.entry p{margin:0}.accent{color:#1d4ed8;font-weight:700}.muted,.date{color:#64748b}.date{font-size:9pt;white-space:nowrap}.entry ul{margin:2mm 0 0;padding-inline-start:5mm;color:#334155}.skills{display:flex;flex-wrap:wrap;gap:2mm}.skill{border:1px solid #dbeafe;border-radius:999px;background:#eff6ff;padding:1.5mm 3mm;color:#1e3a8a;font-size:9pt;font-weight:650;break-inside:avoid}.business-header{display:flex;justify-content:space-between;gap:10mm;border-bottom:1px solid #cbd5e1;padding-bottom:8mm}.business-header h1{margin:1mm 0 0;font-size:24pt}.proposal-label{margin:0;color:#1d4ed8;font-size:8.5pt;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.issuer{max-width:50%;text-align:end}.issuer h2{margin:0;font-family:SmartBody,sans-serif;font-size:13pt}.issuer p{margin:1mm 0 0;color:#475569;white-space:pre-wrap}.business-meta{display:grid;grid-template-columns:1fr 1fr;gap:12mm;margin-top:9mm}.business-meta .label{color:#64748b;font-weight:700}.business-meta h3{margin:2mm 0 0}.business-meta p{margin:1mm 0;color:#475569;white-space:pre-wrap}.business-meta dl{display:grid;grid-template-columns:auto 1fr;gap:2mm 5mm;margin:0}.business-meta dt{color:#64748b}.business-meta dd{margin:0;text-align:end;font-weight:700}table{width:100%;margin-top:10mm;border-collapse:collapse;font-size:9.5pt}th{border-bottom:1px solid #cbd5e1;padding:3mm 2mm;text-align:start;color:#64748b}th:not(:first-child),td:not(:first-child){text-align:end}td{border-bottom:1px solid #f1f5f9;padding:4mm 2mm;break-inside:avoid}.totals{width:52%;margin:7mm 0 0 auto}.quotation .totals{width:56%;border-radius:3mm;background:#eff6ff;padding:4mm}.totals p{display:flex;justify-content:space-between;margin:0 0 2mm;color:#475569}.totals .grand{border-top:2px solid #0f172a;padding-top:3mm;color:#0f172a;font-size:12pt;font-weight:800}.quotation .totals .grand{border-color:#1d4ed8;color:#172554}",
  ].join("");
}

export function renderDocumentHtml(document: SmartDocument, fonts: PdfFontAssets) {
  const content = document.kind === "cv" ? renderCv(document) : renderBusiness(document);
  return "<!doctype html><html lang=\"" + document.locale + "\" dir=\"" + document.direction + "\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width\"><title>" + escapeHtml(document.title) + "</title><style>" + styles(fonts) + "</style></head><body>" + content + "</body></html>";
}
