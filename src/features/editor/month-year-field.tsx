"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/domain/documents/types";

function splitValue(value: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  return { year: match?.[1] ?? "", month: match?.[2] ?? "" };
}

export function MonthYearField({ id, label, locale, value, disabled = false, onChange }: { id: string; label: string; locale: Locale; value: string; disabled?: boolean; onChange: (value: string) => void }) {
  const initial = splitValue(value);
  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(initial.year);
  const ar = locale === "ar";
  const months = useMemo(() => Array.from({ length: 12 }, (_, index) => ({
    value: String(index + 1).padStart(2, "0"),
    label: new Intl.DateTimeFormat(ar ? "ar-OM" : "en-US", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2024, index, 1))),
  })), [ar]);
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: currentYear + 11 - 1950 }, (_, index) => currentYear + 10 - index), [currentYear]);

  function changeMonth(next: string) {
    setMonth(next);
    if (!next) onChange("");
    else if (year) onChange(year + "-" + next);
  }

  function changeYear(next: string) {
    setYear(next);
    if (!next) onChange("");
    else if (month) onChange(next + "-" + month);
  }

  return <fieldset className="grid gap-2 rounded-xl border border-[var(--color-border)] bg-white p-3">
    <legend className="px-1 text-sm font-semibold text-[var(--color-text)]">{label}</legend>
    <div className="grid grid-cols-2 gap-3">
      <label className="grid gap-1 text-xs font-semibold text-[var(--color-text-muted)]" htmlFor={id + "-month"}>{ar ? "الشهر" : "Month"}
        <select id={id + "-month"} value={month} disabled={disabled} onChange={(event) => changeMonth(event.target.value)} className="motion-color min-h-11 rounded-lg border border-[var(--color-border-strong)] bg-white px-3 text-base text-[var(--color-text)] outline-none focus:border-[var(--color-focus)] focus:ring-2 focus:ring-blue-100 disabled:bg-[var(--color-surface-subtle)]">
          <option value="">{ar ? "اختر الشهر" : "Select month"}</option>
          {months.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-semibold text-[var(--color-text-muted)]" htmlFor={id + "-year"}>{ar ? "السنة" : "Year"}
        <select id={id + "-year"} value={year} disabled={disabled} onChange={(event) => changeYear(event.target.value)} className="motion-color min-h-11 rounded-lg border border-[var(--color-border-strong)] bg-white px-3 text-base text-[var(--color-text)] outline-none focus:border-[var(--color-focus)] focus:ring-2 focus:ring-blue-100 disabled:bg-[var(--color-surface-subtle)]">
          <option value="">{ar ? "اختر السنة" : "Select year"}</option>
          {years.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
    </div>
  </fieldset>;
}
