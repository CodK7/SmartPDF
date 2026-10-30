import { directionForLocale, locales, type Locale } from "@/domain/documents/types";

export type AppLocale = Locale;
export const supportedLocales = locales;
export const isLocale = (value: string): value is AppLocale => (locales as readonly string[]).includes(value);
export const directionFor = directionForLocale;
