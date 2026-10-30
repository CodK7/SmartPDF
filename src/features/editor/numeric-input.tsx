import { useEffect, useRef, useState } from "react";
import { Input } from "@/design-system/components/field";

interface NumericInputProps {
  id: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onValueChange: (value: number) => void;
}

function asInputValue(value: number) {
  return Number.isFinite(value) ? String(value) : "";
}

export function NumericInput({ id, value, min, max, step, onValueChange }: NumericInputProps) {
  const [draft, setDraft] = useState(() => asInputValue(value));
  const focused = useRef(false);
  const parsed = Number(draft);
  const invalid = draft !== "" && (!Number.isFinite(parsed) || parsed < min || parsed > max);

  useEffect(() => {
    if (!focused.current) setDraft(asInputValue(value));
  }, [value]);

  function commit() {
    focused.current = false;
    if (draft === "" || !Number.isFinite(parsed)) {
      setDraft(asInputValue(value));
      return;
    }
    const normalized = Math.min(max, Math.max(min, parsed));
    setDraft(asInputValue(normalized));
    onValueChange(normalized);
  }

  return <Input
    id={id}
    type="number"
    inputMode="decimal"
    enterKeyHint="next"
    dir="ltr"
    min={min}
    max={max}
    step={step}
    value={draft}
    aria-invalid={invalid || undefined}
    className="tabular-nums"
    onFocus={() => { focused.current = true; }}
    onChange={(event) => {
      const next = event.target.value;
      setDraft(next);
      const number = Number(next);
      if (next !== "" && Number.isFinite(number) && number >= min && number <= max) onValueChange(number);
    }}
    onBlur={commit}
  />;
}
