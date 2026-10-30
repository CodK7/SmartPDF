"use client";

import { useParams } from "next/navigation";

export default function Loading() {
  const params = useParams<{ locale: string }>();
  return <main id="main-content" className="motion-skeleton mx-auto max-w-6xl px-6 py-14" aria-label={params.locale === "ar" ? "جارٍ تحميل الصفحة" : "Loading"}><div className="h-8 w-64 rounded bg-slate-200" /><div className="mt-4 h-4 w-96 max-w-full rounded bg-slate-100" /><div className="mt-10 grid gap-4 md:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-52 rounded-xl border border-slate-200 bg-white" />)}</div></main>;
}
