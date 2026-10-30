import Link from "next/link";

export default function PrivacyPage() {
  return <main id="main-content" className="min-h-dvh bg-[var(--color-surface)] py-14 sm:py-20">
    <article className="app-container max-w-3xl">
      <Link className="focus-ring inline-flex min-h-11 items-center rounded-lg text-sm font-semibold text-[var(--color-action)]" href="/en">Back to SmartPDF</Link>
      <h1 className="mt-8 text-4xl font-semibold tracking-[-.03em] sm:text-5xl">Privacy at SmartPDF</h1>
      <p className="mt-4 text-sm text-[var(--color-text-secondary)]">Last updated 31 August 2026</p>
      <div className="mt-10 space-y-9 text-base leading-8 text-[var(--color-text-secondary)]">
        <section><h2 className="text-2xl font-semibold text-[var(--color-text)]">Drafts stay on your device</h2><p className="mt-3">SmartPDF stores document drafts in your browser. The current release does not provide cloud document storage or account synchronization.</p></section>
        <section><h2 className="text-2xl font-semibold text-[var(--color-text)]">What happens when you export</h2><p className="mt-3">Only when you choose Export PDF, SmartPDF sends the HTML, CSS, embedded fonts, image, and document data needed for that PDF to Cloudflare Browser Rendering. Cloudflare acts as an external data processor for this operation.</p></section>
        <section><h2 className="text-2xl font-semibold text-[var(--color-text)]">Temporary, restricted processing</h2><p className="mt-3">PDF processing uses no cache, disables JavaScript, and does not use Crawl or Session Recording. The renderer can use embedded data resources only and cannot browse arbitrary websites, localhost, or private networks. SmartPDF does not retain the submitted document or generated PDF on its server after the request completes.</p></section>
        <section><h2 className="text-2xl font-semibold text-[var(--color-text)]">Operational logs</h2><p className="mt-3">Operational logs may contain an error category, response status, timing, and platform request metadata. They must not contain document text, HTML, profile images, or PDF content.</p></section>
        <section><h2 className="text-2xl font-semibold text-[var(--color-text)]">Failure behavior</h2><p className="mt-3">If the protected Cloudflare renderer, its rate limits, or required bindings are unavailable, PDF export stops safely. SmartPDF does not use a less secure production fallback.</p></section>
      </div>
    </article>
  </main>;
}
