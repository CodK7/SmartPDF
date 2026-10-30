"use client";

import { CaretLeft, CaretRight, Files } from "@phosphor-icons/react";
import { clsx } from "clsx";
import Link from "next/link";
import { useState } from "react";
import { Brand } from "@/design-system/components/brand";
import { LanguageSwitch } from "@/design-system/components/language-switch";
import type { Locale } from "@/domain/documents/types";

const labels = {
  en: { documents: "Documents", workspace: "Workspace", collapse: "Collapse sidebar", expand: "Expand sidebar" },
  ar: { documents: "المستندات", workspace: "مساحة العمل", collapse: "إخفاء الشريط الجانبي", expand: "إظهار الشريط الجانبي" },
} as const;

export function WorkspaceShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const text = labels[locale];
  const links = [{ href: `/${locale}/app`, icon: Files, label: text.documents }];
  const ToggleIcon = collapsed
    ? (locale === "ar" ? CaretLeft : CaretRight)
    : (locale === "ar" ? CaretRight : CaretLeft);
  return <div className={clsx("min-h-dvh bg-[var(--color-canvas)] lg:grid", collapsed ? "lg:grid-cols-[44px_1fr]" : "lg:grid-cols-[240px_1fr]")}>
    <aside className={clsx("no-print hidden border-e border-[var(--color-border)] bg-[var(--color-surface)] lg:flex lg:flex-col", collapsed ? "items-center p-0" : "p-4")}>{collapsed ? <button type="button" aria-expanded="false" aria-label={text.expand} title={text.expand} onClick={() => setCollapsed(false)} className="focus-ring motion-control motion-state-entry grid size-11 place-items-center text-[var(--color-text-secondary)] hover:text-[var(--color-action)]"><ToggleIcon size={16} aria-hidden="true" /></button> : <><div className="motion-state-entry flex w-full items-center justify-between gap-2"><Brand locale={locale} /><button type="button" aria-expanded="true" aria-label={text.collapse} title={text.collapse} onClick={() => setCollapsed(true)} className="focus-ring motion-control grid size-11 shrink-0 place-items-center text-[var(--color-text-secondary)] hover:text-[var(--color-action)]"><ToggleIcon size={16} aria-hidden="true" /></button></div><nav className="motion-state-entry mt-6 grid w-full gap-1" aria-label={text.workspace}>{links.map(({ href, icon: Icon, label }) => <Link key={href} href={href} className="focus-ring motion-control flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-action-soft)] hover:text-[var(--color-action)]"><Icon size={20} aria-hidden="true" />{label}</Link>)}</nav><div className="motion-state-entry mt-auto"><LanguageSwitch locale={locale} /></div></>}</aside>
    <div className="min-w-0"><header className="no-print sticky top-0 z-30 flex h-16 items-center border-b border-[var(--color-border)] bg-white/95 px-4 backdrop-blur lg:hidden"><Brand locale={locale} /><span className="ms-auto"><LanguageSwitch locale={locale} /></span></header>{children}<nav aria-label={text.workspace} className="workspace-mobile-nav no-print fixed inset-x-0 bottom-0 z-30 grid grid-cols-1 border-t border-[var(--color-border)] bg-white px-2 pb-[env(safe-area-inset-bottom)] lg:hidden">{links.map(({ href, icon: Icon, label }) => <Link key={href} href={href} className="focus-ring motion-control flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg text-xs font-semibold text-[var(--color-text-secondary)]"><Icon size={21} aria-hidden="true" />{label}</Link>)}</nav></div>
  </div>;
}
