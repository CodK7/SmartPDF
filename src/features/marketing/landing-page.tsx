import { ArrowRight, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { Brand } from "@/design-system/components/brand";
import { LanguageSwitch } from "@/design-system/components/language-switch";
import type { Locale } from "@/domain/documents/types";

const en = {
    title: "Turn your information into a document you are proud to send.",
    body: "Build resumes and invoices in a focused editor. Every change appears instantly in a print-ready preview.",
    primary: "Create a document", secondary: "Open workspace",
    trusted: "Privacy first — drafts stay on your device. During PDF export only, the document is processed temporarily by Cloudflare and is not stored by SmartPDF.",
    privacy: "Privacy details",
    preview: "Live document preview", navigation: "Main navigation",
    name: "Daniel Brooks", role: "Business Manager", profile: "Professional Summary", experience: "Experience",
    summary: "Business manager with a record of improving operations, growing revenue, and building high-performing teams.",
    company: "Harbor & Cole", job: "Senior Business Manager", date: "2021 — Present",
    point: "Led commercial planning and streamlined operations across three regional teams.", skills: "Core skills", skillList: ["Business Strategy", "Team Leadership", "Operations"],
    contact: "daniel.brooks@example.com · +1 (312) 555-0147 · Chicago, IL", photoAlt: "Portrait of Daniel Brooks",
} as const;

const ar = {
    title: "حوّل معلوماتك إلى مستند تفخر بإرساله.",
    body: "أنشئ السير الذاتية والفواتير في محرر مركّز. كل تغيير يظهر فورًا في معاينة جاهزة للطباعة.",
    primary: "أنشئ مستندًا", secondary: "افتح مساحة العمل",
    trusted: "الخصوصية أولًا — تبقى المسودات على جهازك. عند تصدير PDF فقط تتم معالجة المستند مؤقتًا عبر Cloudflare ولا يخزّنه SmartPDF.",
    privacy: "تفاصيل الخصوصية",
    preview: "معاينة المستند الحية", navigation: "التنقل الرئيسي",
    name: "دانيال بروكس", role: "مدير أعمال", profile: "نبذة مهنية", experience: "الخبرات",
    summary: "مدير أعمال بسجل حافل في تحسين العمليات ونمو الإيرادات وبناء فرق عالية الأداء.",
    company: "هاربر آند كول", job: "مدير أعمال أول", date: "2021 — حتى الآن",
    point: "قاد التخطيط التجاري وبسّط العمليات عبر ثلاثة فرق إقليمية.", skills: "المهارات الأساسية", skillList: ["استراتيجية الأعمال", "قيادة الفرق", "العمليات"],
    contact: "daniel.brooks@example.com · +1 (312) 555-0147 · شيكاغو", photoAlt: "صورة شخصية لدانيال بروكس",
} as const;

export function LandingPage({ locale = "en" }: { locale?: Locale }) {
  const text = locale === "ar" ? ar : en;
  return <main id="main-content" className="min-h-dvh bg-[var(--color-surface)]">
    <header className="border-b border-[var(--color-border)]"><div className="app-container flex h-18 items-center justify-between"><Brand locale={locale} /><nav aria-label={text.navigation} className="flex items-center gap-2"><LanguageSwitch locale={locale} /><Link href={`/${locale}/app`} className="focus-ring motion-control display-type hidden min-h-11 items-center rounded-lg border border-[var(--color-border-strong)] px-4 py-2.5 text-sm font-semibold hover:bg-[var(--color-surface-subtle)] sm:inline-flex">{text.secondary}</Link></nav></div></header>
    <section className="app-container grid min-h-[calc(100dvh-72px)] items-center gap-14 py-16 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
      <div><h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-.035em] sm:text-5xl lg:text-6xl">{text.title}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-text-secondary)]">{text.body}</p><div className="mt-9"><Link href={`/${locale}/app/documents/new`} className="focus-ring motion-control inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--color-action)] px-5 font-semibold text-white hover:bg-[var(--color-action-hover)]">{text.primary}<ArrowRight aria-hidden="true" /></Link></div><p className="mt-5 flex max-w-2xl items-start gap-2 text-sm leading-6 text-[var(--color-text-secondary)]"><ShieldCheck className="mt-0.5 shrink-0 text-[var(--color-success)]" size={19} aria-hidden="true" /><span>{text.trusted} <Link className="focus-ring rounded-sm font-semibold text-[var(--color-action)] underline underline-offset-2" href={`/${locale}/privacy`}>{text.privacy}</Link></span></p></div>
      <div aria-label={text.preview} className="relative mx-auto w-full max-w-[540px] rounded-[22px] border border-slate-200 bg-slate-100 p-4 shadow-[0_30px_80px_rgb(15_23_42/.18)] sm:p-7">
        <div className="mb-4 flex items-center justify-between text-xs font-semibold text-[var(--color-text-secondary)]"><span>{text.preview}</span><span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 tabular-nums">A4</span></div>
        <article className="aspect-[210/297] overflow-hidden rounded-[3px] border border-slate-200 bg-white p-[9%] shadow-[0_2px_4px_rgb(15_23_42/.08),0_18px_40px_rgb(15_23_42/.10)]" dir="ltr">
          <header className="border-b-2 border-blue-700 pb-5"><div className="flex items-center gap-4"><Image src="/landing/business-manager-profile.webp" alt={text.photoAlt} width={72} height={72} className="size-[clamp(48px,8vw,72px)] shrink-0 rounded-full border-2 border-white object-cover shadow-sm ring-1 ring-slate-200" priority /><div className="min-w-0"><h2 className="document-display text-[clamp(18px,3vw,28px)] font-semibold leading-none text-slate-950">{text.name}</h2><p className="mt-2 text-[clamp(9px,1.5vw,13px)] font-semibold text-blue-700">{text.role}</p></div></div><p className="mt-3 text-[clamp(7px,1.2vw,10px)] text-slate-500" dir="ltr">{text.contact}</p></header>
          <section className="mt-[7%]"><h3 className="document-display text-[clamp(10px,1.6vw,14px)] font-semibold text-slate-950">{text.profile}</h3><p className="mt-2 text-[clamp(7px,1.25vw,10.5px)] leading-[1.75] text-slate-600">{text.summary}</p></section>
          <section className="mt-[7%]"><h3 className="document-display text-[clamp(10px,1.6vw,14px)] font-semibold text-slate-950">{text.experience}</h3><div className="mt-3 flex items-start justify-between gap-4"><div><p className="text-[clamp(8px,1.35vw,11px)] font-bold text-slate-900">{text.job}</p><p className="mt-1 text-[clamp(7px,1.2vw,10px)] font-semibold text-blue-700">{text.company}</p></div><span className="shrink-0 text-[clamp(6px,1vw,9px)] text-slate-500">{text.date}</span></div><div className="mt-3 flex gap-2"><span className="mt-1.5 size-1 shrink-0 rounded-full bg-blue-700" /><p className="text-[clamp(7px,1.2vw,10px)] leading-[1.7] text-slate-600">{text.point}</p></div></section>
          <section className="mt-[7%] border-t border-slate-200 pt-[5%]"><h3 className="document-display text-[clamp(10px,1.6vw,14px)] font-semibold text-slate-950">{text.skills}</h3><div className="mt-3 flex flex-wrap gap-2">{text.skillList.map((skill) => <span key={skill} className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[clamp(6px,1vw,9px)] font-semibold text-blue-800">{skill}</span>)}</div></section>
        </article>
      </div>
    </section>
  </main>;
}
