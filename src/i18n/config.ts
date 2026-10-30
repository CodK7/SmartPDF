import { directionForLocale, locales, type Locale } from "@/domain/documents/types";

export type AppLocale = Locale;
export const supportedLocales = locales;
export const isLocale = (value: string): value is AppLocale => (locales as readonly string[]).includes(value);
export const directionFor = directionForLocale;

const en = {
  brand: "SmartPDF", create: "Create document", documents: "Documents", templates: "Templates",
  dashboard: "Your document workspace",
  emptyTitle: "Create your first professional document", emptyBody: "Choose a type and see every change in a live, print-ready preview.",
  recent: "Recent documents", open: "Open", delete: "Delete", exportPdf: "Export PDF", back: "Back",
  save: { idle: "Not saved", saving: "Saving…", saved: "Saved on this device", error: "Could not save" },
};

export type Dictionary = typeof en;
export const messages: Record<AppLocale, Dictionary> = {
  en,
  ar: {
    brand: "SmartPDF", create: "إنشاء مستند", documents: "المستندات", templates: "القوالب",
    dashboard: "مساحة مستنداتك",
    emptyTitle: "أنشئ أول مستند احترافي لك", emptyBody: "اختر نوع المستند وشاهد كل تغيير في معاينة حية جاهزة للطباعة.",
    recent: "المستندات الأخيرة", open: "فتح", delete: "حذف", exportPdf: "تصدير PDF", back: "رجوع",
    save: { idle: "غير محفوظ", saving: "جارٍ الحفظ…", saved: "تم الحفظ على هذا الجهاز", error: "تعذر الحفظ" },
  },
};
export const dictionaryFor = (locale: AppLocale): Dictionary => messages[locale];
