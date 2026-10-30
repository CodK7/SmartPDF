"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/domain/documents/types";

export function LanguageSwitch({ locale }: { locale: Locale }) {
  const pathname = usePathname() ?? `/${locale}`;
  const target: Locale = locale === "ar" ? "en" : "ar";
  const href = pathname.replace(/^\/(en|ar)(?=\/|$)/, `/${target}`);
  return <Link href={href} lang={target} hrefLang={target} className="focus-ring motion-control inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-action-soft)] hover:text-[var(--color-action)]">{target === "ar" ? "العربية" : "English"}</Link>;
}
