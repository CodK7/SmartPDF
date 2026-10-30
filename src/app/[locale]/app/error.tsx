"use client";

import { Button } from "@/design-system/components/button";
import { useParams } from "next/navigation";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const params = useParams<{ locale: string }>();
  const ar = params.locale === "ar";
  return <main id="main-content" className="grid min-h-[70dvh] place-items-center p-6"><div role="alert" className="surface max-w-md rounded-xl p-8 text-center"><h1 className="text-2xl font-bold">{ar ? "حدث خطأ غير متوقع" : "Something went wrong"}</h1><p className="mt-3 text-[var(--color-text-secondary)]">{ar ? "لم تتغير مستنداتك المحفوظة. حاول تحميل الصفحة مرة أخرى." : "Your local documents were not changed. Try loading this view again."}</p><Button className="mt-6" onClick={reset}>{ar ? "حاول مرة أخرى" : "Try again"}</Button></div></main>;
}
