"use client";

import { X } from "@phosphor-icons/react";
import { useState } from "react";
import type { Locale } from "@/domain/documents/types";

export function SkillsInput({ id, locale, value, onChange }: { id: string; locale: Locale; value: string[]; onChange: (value: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const ar = locale === "ar";

  function commit(raw = draft) {
    const skill = raw.trim().replace(/\s+/g, " ").slice(0, 160);
    if (skill && !value.some((item) => item.localeCompare(skill, undefined, { sensitivity: "accent" }) === 0) && value.length < 80) onChange([...value, skill]);
    setDraft("");
  }

  function remove(index: number) {
    onChange(value.filter((_, itemIndex) => itemIndex !== index));
  }

  return <div className="grid gap-2">
    <label htmlFor={id} className="text-sm font-semibold text-[var(--color-text)]">{ar ? "المهارات" : "Skills"}</label>
    <div className="motion-color flex min-h-12 flex-wrap items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-white p-2 focus-within:border-[var(--color-focus)] focus-within:ring-2 focus-within:ring-blue-100">
      {value.map((skill, index) => <span key={skill + index} className="inline-flex min-h-10 items-center rounded-full border border-blue-100 bg-blue-50 ps-3 text-sm font-semibold text-blue-900"><span dir="auto">{skill}</span><button type="button" onClick={() => remove(index)} className="focus-ring motion-control ms-1 grid size-10 place-items-center rounded-full text-blue-800 hover:bg-blue-100" aria-label={(ar ? "حذف المهارة " : "Remove skill ") + skill}><X size={15} aria-hidden="true" /></button></span>)}
      <input id={id} dir="auto" value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={() => { if (draft.trim()) commit(); }} onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === "," || event.key === "،") { event.preventDefault(); commit(); }
        else if (event.key === "Backspace" && !draft && value.length) remove(value.length - 1);
      }} className="min-h-11 min-w-[180px] flex-1 border-0 bg-transparent px-2 text-base outline-none" placeholder={ar ? "اكتب مهارة ثم اضغط Enter أو فاصلة" : "Type a skill, then press Enter or comma"} />
    </div>
    <p className="text-xs leading-5 text-[var(--color-text-muted)]">{ar ? "المسافات مسموحة داخل اسم المهارة، مثل: العمل تحت الضغط." : "Spaces are allowed inside a skill, for example: Problem solving."}</p>
    <span className="sr-only" aria-live="polite">{ar ? value.length + " مهارة مضافة" : value.length + " skills added"}</span>
  </div>;
}
