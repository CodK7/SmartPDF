import type { Direction, Locale } from "@/domain/documents/types";

export type AppLocale = Extract<Locale, "en">;
export const supportedLocales = ["en"] as const satisfies readonly Locale[];
export const isLocale = (value: string): value is AppLocale => value === "en";
export const directionFor = (locale: AppLocale): Direction => {
  void locale;
  return "ltr";
};

export const messages = {
  en: {
    brand: "SmartPDF", create: "Create document", documents: "Documents", templates: "Templates",
    dashboard: "Your document workspace",
    emptyTitle: "Create your first professional document", emptyBody: "Choose a type and see every change in a live, print-ready preview.",
    recent: "Recent documents", open: "Open", delete: "Delete", exportPdf: "Export PDF", back: "Back",
    save: { idle: "Not saved", saving: "Saving…", saved: "Saved on this device", error: "Could not save" },
  },
} as const;

export type Dictionary = typeof messages.en;
export const dictionaryFor = (locale: AppLocale): Dictionary => {
  void locale;
  return messages.en;
};
