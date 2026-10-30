 "use client";

import { calculateTotals, formatMoney } from "@/domain/documents/money";
import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cvAchievementLines, directionForText } from "@/domain/documents/cv-format";
import type { CvDocument, InvoiceDocument, QuotationDocument, SmartDocument } from "@/domain/documents/types";

const previewCopy = {
  en: {
    preview: "Document preview", yourName: "Your name", headline: "Professional headline", specialization: "Professional field",
    profile: "Profile", experience: "Experience", education: "Education", skills: "Skills",
    role: "Role", company: "Company", present: "Present", business: "Your business",
    billTo: "Bill to", client: "Client name", issueDate: "Issue date", dueDate: "Due date",
    validUntil: "Valid until", description: "Description", quantity: "Qty", price: "Price",
    amount: "Amount", lineItem: "Line item", subtotal: "Subtotal", discount: "Discount",
    tax: "Tax", total: "Total", totalProposed: "Total proposed amount", terms: "Terms / Conditions", notes: "Notes",
    invoiceNumber: "Invoice number", quoteNumber: "Quote number", proposal: "Commercial proposal", preparedFor: "Prepared for", itemService: "Item / service",
  },
  ar: {
    preview: "معاينة المستند", yourName: "اسمك الكامل", headline: "المسمى المهني", specialization: "المجال المهني",
    profile: "نبذة مهنية", experience: "الخبرات", education: "التعليم", skills: "المهارات",
    role: "المسمى الوظيفي", company: "الشركة", present: "حتى الآن", business: "اسم منشأتك",
    billTo: "العميل", client: "اسم العميل", issueDate: "تاريخ الإصدار", dueDate: "تاريخ الاستحقاق",
    validUntil: "صالح حتى", description: "الوصف", quantity: "الكمية", price: "السعر",
    amount: "المبلغ", lineItem: "بند", subtotal: "المجموع الفرعي", discount: "الخصم",
    tax: "الضريبة", total: "الإجمالي", totalProposed: "إجمالي المبلغ المقترح", terms: "الشروط والأحكام", notes: "ملاحظات",
    invoiceNumber: "رقم الفاتورة", quoteNumber: "رقم عرض السعر", proposal: "عرض تجاري قبل الفاتورة", preparedFor: "مقدم إلى", itemService: "الخدمة / البند",
  },
} as const;

export function DocumentPreview({ document }: { document: SmartDocument }) {
  const text = previewCopy[document.locale];
  const pageWidth = document.paper === "LETTER" ? 816 : 794;
  const [scale, setScale] = useState(0.42);
  const scaleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const preview = scaleRef.current;
    const container = preview?.parentElement;
    if (!preview || !container) return;

    const updateScale = () => {
      const style = window.getComputedStyle(container);
      const availableWidth = container.clientWidth - Number.parseFloat(style.paddingInlineStart) - Number.parseFloat(style.paddingInlineEnd);
      const preferredScale = window.innerWidth >= 1152 ? 0.76 : window.innerWidth >= 768 ? 0.56 : 0.5;
      const nextScale = Math.min(preferredScale, Math.max(0.25, availableWidth / pageWidth));
      setScale((current) => Math.abs(current - nextScale) < 0.001 ? current : Number(nextScale.toFixed(3)));
    };

    updateScale();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateScale);
      return () => window.removeEventListener("resize", updateScale);
    }
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    window.addEventListener("resize", updateScale);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, [pageWidth]);

  const style = {
    "--preview-scale": String(scale),
    "--paper-width": document.paper === "LETTER" ? "215.9mm" : "210mm",
    "--paper-height": document.paper === "LETTER" ? "279.4mm" : "297mm",
  } as CSSProperties;

  const businessPages = document.kind === "cv" ? [] : paginateBusinessItems(document);
  return <div ref={scaleRef} className="preview-pages" style={style}>
    {document.kind === "cv" ? <PreviewPage document={document} label={`${document.title} — ${text.preview}`}><CvPreview document={document} /></PreviewPage> : businessPages.map((items, index) => <PreviewPage key={`${document.id}-${index}`} document={document} label={`${document.title} — ${text.preview} — ${index + 1}/${businessPages.length}`}><BusinessPreview document={document} items={items} showHeader={index === 0} showFooter={index === businessPages.length - 1} /></PreviewPage>)}
  </div>;
}

function PreviewPage({ document, label, children }: { document: SmartDocument; label: string; children: React.ReactNode }) {
  return <div className="preview-scale"><article className="document-page" data-paper={document.paper} dir={document.direction} aria-label={label}>{children}</article></div>;
}

function paginateBusinessItems(document: InvoiceDocument | QuotationDocument) {
  const items = document.content.lineItems;
  if (items.length <= 11) return [items];
  const pages = [items.slice(0, 11)];
  let cursor = 11;
  while (items.length - cursor > 7) {
    const count = Math.min(14, items.length - cursor - 7);
    pages.push(items.slice(cursor, cursor + count));
    cursor += count;
  }
  pages.push(items.slice(cursor));
  return pages;
}

function CvPreview({ document }: { document: CvDocument }) {
  const { content } = document;
  const editorial = document.templateId === "editorial";
  const text = previewCopy[document.locale];
  return <div className={`page-content cv-document ${editorial ? "editorial" : "professional"}`}>
    <header className="cv-header"><div className="cv-identity">{content.profilePhotoDataUrl ? <Image unoptimized src={content.profilePhotoDataUrl} width={82} height={82} alt="" aria-hidden="true" className="cv-photo" /> : null}<div className="cv-identity-copy"><h1 className="cv-display cv-name" dir="auto">{content.fullName || text.yourName}</h1><p className="cv-headline" dir="auto">{content.headline || text.headline}</p><p className="cv-specialization" dir="auto">{content.specialization || text.specialization}</p></div></div><p className="cv-contacts" dir="auto">{[content.email, content.phone, content.location].filter(Boolean).join(" · ") || "email@example.com · +000 000 000"}</p></header>
    {content.summary ? <PreviewSection title={text.profile}><p className="cv-body-copy" dir="auto">{content.summary}</p></PreviewSection> : null}
    {content.experiences.length ? <PreviewSection title={text.experience}>{content.experiences.map((experience) => { const lines = cvAchievementLines(experience.bullets); return <article key={experience.id} className="cv-entry"><div className="cv-entry-head"><div><h3 className="cv-entry-title" dir="auto">{experience.role || text.role}</h3><p className="cv-entry-company" dir="auto">{experience.company || text.company}</p></div><p className="cv-entry-date">{formatDateRange(experience.startDate, experience.current ? text.present : experience.endDate, document.locale)}</p></div>{lines.length ? <ul className="cv-achievements">{lines.map((line, index) => <li dir={directionForText(line, document.direction)} key={`${experience.id}-${index}`}>{line}</li>)}</ul> : null}</article>; })}</PreviewSection> : null}
    {content.education.length ? <PreviewSection title={text.education}>{content.education.map((education) => <article key={education.id} className="cv-entry cv-entry-head"><div><h3 className="cv-entry-title" dir="auto">{education.degree}</h3><p className="cv-entry-school" dir="auto">{education.institution}</p></div><p className="cv-entry-date">{formatDateRange(education.startDate, education.endDate, document.locale)}</p></article>)}</PreviewSection> : null}
    {content.skills.length ? <PreviewSection title={text.skills}><div className="cv-skills">{content.skills.filter(Boolean).map((skill) => <span key={skill} className="cv-skill" dir="auto">{skill}</span>)}</div></PreviewSection> : null}
  </div>;
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="cv-section"><h2 className="cv-display cv-section-title">{title}</h2>{children}</section>;
}

function formatDateRange(start: string, end: string, locale: "en" | "ar") {
  const format = (value: string) => {
    const match = /^(\d{4})-(\d{2})$/.exec(value);
    if (!match) return value;
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-US", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1)));
  };
  return [start, end].filter(Boolean).map(format).join(" – ");
}

function BusinessPreview({ document, items, showHeader, showFooter }: { document: InvoiceDocument | QuotationDocument; items: InvoiceDocument["content"]["lineItems"]; showHeader: boolean; showFooter: boolean }) {
  const { content } = document;
  const totals = calculateTotals(content);
  const locale = document.locale === "ar" ? "ar-OM" : "en-US";
  const text = previewCopy[document.locale];
  const quotation = document.kind === "quotation";
  const type = quotation ? (document.locale === "ar" ? "عرض سعر" : "QUOTATION") : (document.locale === "ar" ? "فاتورة" : "INVOICE");
  return <div className={`page-content font-sans ${document.templateId === "ledger" ? "text-slate-950" : "text-slate-900"}`}>
    {showHeader ? <><header className="flex items-start justify-between gap-8 border-b border-slate-300 pb-8"><div>{quotation ? <p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-blue-700">{text.proposal}</p> : null}<h1 className="text-[30px] font-bold tracking-tight">{type}</h1><p className="mt-2 text-[11px] text-slate-500"><span className="font-semibold">{quotation ? text.quoteNumber : text.invoiceNumber}</span> · {content.number || "—"}</p></div><div className="max-w-[48%] text-end"><h2 className="text-[16px] font-bold">{content.issuer.name || text.business}</h2><p className="mt-2 whitespace-pre-line text-[11px] leading-[1.7] text-slate-600">{content.issuer.address}</p><p className="text-[11px] text-slate-600">{content.issuer.email}</p></div></header><div className="mt-9 grid grid-cols-2 gap-10"><div><p className="text-[11px] font-bold text-slate-500">{quotation ? text.preparedFor : text.billTo}</p><p className="mt-2 text-[14px] font-bold">{content.client.name || text.client}</p><p className="mt-1 whitespace-pre-line text-[11px] leading-[1.7] text-slate-600">{content.client.address}</p></div><dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-[11px]"><dt className="text-slate-500">{text.issueDate}</dt><dd className="text-end font-semibold">{content.issueDate || "—"}</dd>{!quotation && content.dueDate ? <><dt className="text-slate-500">{text.dueDate}</dt><dd className="text-end font-semibold">{content.dueDate}</dd></> : null}{quotation && document.content.validUntil ? <><dt className="text-slate-500">{text.validUntil}</dt><dd className="text-end font-semibold">{document.content.validUntil}</dd></> : null}</dl></div></> : null}
    <table className={showHeader ? "mt-10 w-full border-collapse text-[11px]" : "w-full border-collapse text-[11px]"}><thead><tr className="border-b border-slate-300 text-start text-slate-500"><th className="py-3 text-start font-semibold">{quotation ? text.itemService : text.description}</th><th className="w-16 py-3 text-end font-semibold">{text.quantity}</th><th className="w-28 py-3 text-end font-semibold">{text.price}</th><th className="w-28 py-3 text-end font-semibold">{text.amount}</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b border-slate-100"><td className="py-4 pe-3 font-medium">{item.description || text.lineItem}</td><td className="py-4 text-end tabular-nums">{item.quantity}</td><td className="py-4 text-end tabular-nums">{formatMoney(item.unitPriceMinor, content.currency, locale)}</td><td className="py-4 text-end font-semibold tabular-nums">{formatMoney(Math.round(item.quantity * item.unitPriceMinor), content.currency, locale)}</td></tr>)}</tbody></table>
    {showFooter ? <><div className={`ms-auto mt-7 w-[56%] ${quotation ? "rounded-xl bg-blue-50 p-4" : ""}`}><TotalRow label={text.subtotal} value={formatMoney(totals.subtotalMinor, content.currency, locale)} />{content.discountMinor ? <TotalRow label={text.discount} value={`−${formatMoney(content.discountMinor, content.currency, locale)}`} /> : null}{content.taxRate ? <TotalRow label={`${text.tax} (${content.taxRate}%)`} value={formatMoney(totals.taxMinor, content.currency, locale)} /> : null}<div className={`mt-3 flex justify-between border-t-2 pt-3 text-[15px] font-bold ${quotation ? "border-blue-700 text-blue-950" : "border-slate-900"}`}><span>{quotation ? text.totalProposed : text.total}</span><span>{formatMoney(totals.totalMinor, content.currency, locale)}</span></div></div>{document.kind === "quotation" && document.content.terms ? <PreviewNote title={text.terms} text={document.content.terms} /> : null}{content.notes ? <PreviewNote title={text.notes} text={content.notes} /> : null}</> : null}
  </div>;
}

function TotalRow({ label, value }: { label: string; value: string }) { return <div className="mb-2 flex justify-between text-[11px] text-slate-600"><span>{label}</span><span className="font-semibold tabular-nums text-slate-900">{value}</span></div>; }
function PreviewNote({ title, text }: { title: string; text: string }) { return <section className="mt-9 border-t border-slate-200 pt-4"><h2 className="text-[11px] font-bold text-slate-500">{title}</h2><p className="mt-2 whitespace-pre-line text-[11px] leading-[1.7] text-slate-600">{text}</p></section>; }
