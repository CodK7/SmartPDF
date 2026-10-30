"use client";

import { Popover } from "@base-ui/react/popover";
import { CalendarBlank, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Field } from "@/design-system/components/field";

type DateParts = { year: number; month: number; day: number };

const copy = {
  en: { select: "Select date", previous: "Previous month", next: "Next month", month: "Month", year: "Year", today: "Today", clear: "Clear" },
  ar: { select: "اختر التاريخ", previous: "الشهر السابق", next: "الشهر التالي", month: "الشهر", year: "السنة", today: "اليوم", clear: "مسح" },
} as const;

function parseDate(value: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) - 1, day: Number(match[3]) };
}

function toIso({ year, month, day }: DateParts) {
  return `${year.toString().padStart(4, "0")}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

function todayParts(): DateParts {
  const today = new Date();
  return { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() };
}

export function DatePickerField({ id, label, value, onChange, locale, min }: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  locale: "en" | "ar";
  min?: string;
}) {
  const text = copy[locale];
  const initial = parseDate(value) ?? parseDate(min ?? "") ?? todayParts();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);
  const selected = parseDate(value);
  const minimum = parseDate(min ?? "");
  const localeName = locale === "ar" ? "ar" : "en-US";
  const monthNames = useMemo(() => Array.from({ length: 12 }, (_, month) => new Intl.DateTimeFormat(localeName, { month: "long" }).format(new Date(2026, month, 1))), [localeName]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, day) => new Intl.DateTimeFormat(localeName, { weekday: "narrow" }).format(new Date(2026, 7, 2 + day))), [localeName]);
  const yearRange = useMemo(() => {
    const current = new Date().getFullYear();
    const first = Math.min(current - 20, viewYear, minimum?.year ?? current);
    const last = Math.max(current + 30, viewYear);
    return Array.from({ length: last - first + 1 }, (_, index) => first + index);
  }, [minimum?.year, viewYear]);
  const days = Array.from({ length: new Date(viewYear, viewMonth + 1, 0).getDate() }, (_, index) => index + 1);
  const leadingBlanks = new Date(viewYear, viewMonth, 1).getDay();

  function syncView() {
    const next = parseDate(value) ?? parseDate(min ?? "") ?? todayParts();
    setViewYear(next.year);
    setViewMonth(next.month);
  }

  function changeMonth(offset: number) {
    const next = new Date(viewYear, viewMonth + offset, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  function selectDay(day: number) {
    onChange(toIso({ year: viewYear, month: viewMonth, day }));
    setOpen(false);
  }

  function isDisabled(day: number) {
    return minimum ? toIso({ year: viewYear, month: viewMonth, day }) < toIso(minimum) : false;
  }

  function moveDayFocus(day: number, offset: number) {
    const next = new Date(viewYear, viewMonth, day + offset);
    const nextParts = { year: next.getFullYear(), month: next.getMonth(), day: next.getDate() };
    setViewYear(nextParts.year);
    setViewMonth(nextParts.month);
    requestAnimationFrame(() => document.getElementById(`${id}-day-${toIso(nextParts)}`)?.focus());
  }

  const displayValue = selected
    ? new Intl.DateTimeFormat(localeName, { day: "2-digit", month: "long", year: "numeric" }).format(new Date(selected.year, selected.month, selected.day))
    : text.select;

  return <Field id={id} label={label}>
    <Popover.Root open={open} onOpenChange={(nextOpen) => { if (nextOpen) syncView(); setOpen(nextOpen); }}>
      <Popover.Trigger id={id} className="focus-ring motion-color flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-[var(--color-border-strong)] bg-white px-3 text-start text-base text-[var(--color-text)] hover:border-[var(--color-focus)]" aria-label={label}>
        <span className={value ? "tabular-nums" : "text-[var(--color-text-muted)]"}>{displayValue}</span><CalendarBlank size={20} className="shrink-0 text-[var(--color-text-muted)]" aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="top" align="start" sideOffset={8} collisionPadding={12} className="z-50">
          <Popover.Popup className="motion-popover max-h-[calc(100dvh-24px)] w-[min(320px,calc(100vw-24px))] overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-white p-4 text-[var(--color-text)] shadow-[0_18px_50px_rgb(15_23_42/.18)] outline-none" dir={locale === "ar" ? "rtl" : "ltr"}>
            <Popover.Title className="sr-only">{label}</Popover.Title>
            <div className="grid grid-cols-[44px_1fr_1fr_44px] items-center gap-2">
              <button type="button" onClick={() => changeMonth(-1)} aria-label={text.previous} className="focus-ring motion-control grid size-11 place-items-center rounded-lg hover:bg-[var(--color-surface-subtle)]"><CaretLeft className="rtl:rotate-180" size={18} aria-hidden="true" /></button>
              <label className="sr-only" htmlFor={`${id}-month`}>{text.month}</label><select id={`${id}-month`} aria-label={text.month} value={viewMonth} onChange={(event) => setViewMonth(Number(event.target.value))} className="motion-color min-h-11 min-w-0 rounded-lg border border-[var(--color-border-strong)] bg-white px-2 font-semibold outline-none focus:border-[var(--color-focus)] focus:ring-2 focus:ring-blue-100">{monthNames.map((month, index) => <option key={month} value={index}>{month}</option>)}</select>
              <label className="sr-only" htmlFor={`${id}-year`}>{text.year}</label><select id={`${id}-year`} aria-label={text.year} value={viewYear} onChange={(event) => setViewYear(Number(event.target.value))} className="motion-color min-h-11 min-w-0 rounded-lg border border-[var(--color-border-strong)] bg-white px-2 font-semibold tabular-nums outline-none focus:border-[var(--color-focus)] focus:ring-2 focus:ring-blue-100">{yearRange.map((year) => <option key={year}>{year}</option>)}</select>
              <button type="button" onClick={() => changeMonth(1)} aria-label={text.next} className="focus-ring motion-control grid size-11 place-items-center rounded-lg hover:bg-[var(--color-surface-subtle)]"><CaretRight className="rtl:rotate-180" size={18} aria-hidden="true" /></button>
            </div>
            <div className="mt-4 grid grid-cols-7 text-center" aria-hidden="true">{weekDays.map((day, index) => <span key={`${day}-${index}`} className="py-2 text-xs font-semibold text-[var(--color-text-muted)]">{day}</span>)}</div>
            <div className="grid grid-cols-7 gap-0.5" role="grid">{Array.from({ length: leadingBlanks }, (_, index) => <span key={`blank-${index}`} aria-hidden="true" />)}{days.map((day) => {
              const iso = toIso({ year: viewYear, month: viewMonth, day });
              const active = value === iso;
              return <button key={day} id={`${id}-day-${iso}`} type="button" role="gridcell" disabled={isDisabled(day)} aria-selected={active} aria-label={new Intl.DateTimeFormat(localeName, { dateStyle: "full" }).format(new Date(viewYear, viewMonth, day))} onClick={() => selectDay(day)} onKeyDown={(event) => { const offsets: Partial<Record<string, number>> = { ArrowLeft: locale === "ar" ? 1 : -1, ArrowRight: locale === "ar" ? -1 : 1, ArrowUp: -7, ArrowDown: 7, Home: -new Date(viewYear, viewMonth, day).getDay(), End: 6 - new Date(viewYear, viewMonth, day).getDay() }; const offset = offsets[event.key]; if (offset !== undefined) { event.preventDefault(); moveDayFocus(day, offset); } }} className={`focus-ring motion-control grid aspect-square min-h-10 place-items-center rounded-lg text-sm tabular-nums disabled:cursor-not-allowed disabled:text-slate-300 ${active ? "bg-[var(--color-action)] font-bold text-white" : "hover:bg-[var(--color-action-soft)]"}`}>{new Intl.NumberFormat(localeName, { useGrouping: false }).format(day)}</button>;
            })}</div>
            <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-3"><button type="button" onClick={() => { onChange(""); setOpen(false); }} className="focus-ring motion-control min-h-11 rounded-lg px-3 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]">{text.clear}</button><button type="button" disabled={minimum ? toIso(todayParts()) < toIso(minimum) : false} onClick={() => { const today = todayParts(); onChange(toIso(today)); setViewYear(today.year); setViewMonth(today.month); setOpen(false); }} className="focus-ring motion-control min-h-11 rounded-lg px-3 text-sm font-semibold text-[var(--color-action)] hover:bg-[var(--color-action-soft)] disabled:cursor-not-allowed disabled:text-slate-300">{text.today}</button></div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  </Field>;
}
