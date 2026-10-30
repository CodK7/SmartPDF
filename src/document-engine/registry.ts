import { createDocument } from "@/domain/documents/defaults";
import { preflight } from "@/domain/documents/preflight";
import type { DocumentKind, Locale } from "@/domain/documents/types";

interface TemplateDefinition {
  id: string;
  name: Readonly<Record<Locale, string>>;
  description: Readonly<Record<Locale, string>>;
  supportedKinds: readonly DocumentKind[];
}

export const templates: readonly TemplateDefinition[] = [
  {
    id: "signature",
    name: { en: "Professional", ar: "الاحترافي" },
    description: { en: "Crisp hierarchy with a restrained blue accent.", ar: "تسلسل بصري واضح مع لمسة زرقاء هادئة." },
    supportedKinds: ["cv", "invoice", "quotation"],
  },
  {
    id: "editorial",
    name: { en: "Editorial", ar: "التحريري" },
    description: { en: "Strong typographic rhythm for professional resumes.", ar: "تنسيق طباعي واضح للسيرة الذاتية الاحترافية." },
    supportedKinds: ["cv"],
  },
  {
    id: "ledger",
    name: { en: "Ledger", ar: "الأعمال" },
    description: { en: "Dense, highly legible business-document layout.", ar: "تخطيط عملي وواضح للفواتير وعروض الأسعار." },
    supportedKinds: ["invoice", "quotation"],
  },
];

const documentDefinitions = {
  cv: {
    kind: "cv",
    name: { en: "CV / Resume", ar: "السيرة الذاتية" },
    description: { en: "A focused, ATS-aware professional resume.", ar: "سيرة ذاتية احترافية واضحة ومتوافقة مع أنظمة التوظيف." },
  },
  invoice: {
    kind: "invoice",
    name: { en: "Invoice", ar: "فاتورة" },
    description: { en: "A clear invoice with accurate totals.", ar: "فاتورة واضحة بحسابات دقيقة." },
  },
  quotation: {
    kind: "quotation",
    name: { en: "Quotation", ar: "عرض سعر" },
    description: { en: "A structured commercial quotation.", ar: "عرض سعر تجاري منظم وواضح." },
  },
} satisfies Record<DocumentKind, { kind: DocumentKind; name: Readonly<Record<Locale, string>>; description: Readonly<Record<Locale, string>> }>;

export function templateText(template: TemplateDefinition, locale: Locale) {
  return { name: template.name[locale], description: template.description[locale] };
}

export function documentDefinitionFor(kind: DocumentKind, locale: Locale) {
  const definition = documentDefinitions[kind];
  return { kind, name: definition.name[locale], description: definition.description[locale] };
}

export const documentEngine = {
  create: (kind: DocumentKind, locale: Locale) => createDocument(kind, locale),
  preflight,
  templatesFor: (kind: DocumentKind) => templates.filter((template) => template.supportedKinds.includes(kind)),
};
