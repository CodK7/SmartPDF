import { clsx } from "clsx";
import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function Field({ id, label, hint, error, children }: FieldProps) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-[var(--color-text)]">{label}</label>
      {children}
      {hint && !error ? <p id={`${id}-hint`} className="text-xs text-[var(--color-text-muted)]">{hint}</p> : null}
      {error ? <p id={`${id}-error`} role="alert" className="text-xs font-medium text-[var(--color-danger)]">{error}</p> : null}
    </div>
  );
}

const controlClass = "motion-color min-h-11 w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-base text-[var(--color-text)] outline-none focus:border-[var(--color-focus)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-focus)_18%,transparent)] disabled:bg-[var(--color-surface-subtle)]";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={clsx(controlClass, className)} {...props} />;
});

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={clsx(controlClass, "min-h-28 resize-y py-2.5", className)} {...props} />;
}
