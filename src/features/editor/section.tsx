export function EditorSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return <section className="border-b border-[var(--color-border)] py-7 first:pt-0 last:border-0"><div className="mb-5"><h2 className="text-lg font-bold">{title}</h2>{description ? <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{description}</p> : null}</div><div className="grid gap-4">{children}</div></section>;
}
