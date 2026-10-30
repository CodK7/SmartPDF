import Image from "next/image";
import Link from "next/link";

export function Brand({ locale, compact = false }: { locale: string; compact?: boolean }) {
  return <Link href={`/${locale}`} className="focus-ring motion-control brand-lockup inline-flex items-center gap-2.5 rounded-lg">
    <Image src="/brand/smartpdf-mark.svg" width={36} height={36} priority alt="" aria-hidden="true" className="size-9 object-contain" />
    {compact ? <span className="sr-only">SmartPDF</span> : <span className="brand-wordmark">SmartPDF</span>}
  </Link>;
}
