import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";

const buttonStyles = cva(
  "motion-control inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45",
  { variants: {
    variant: {
      primary: "bg-[var(--color-action)] text-white hover:bg-[var(--color-action-hover)]",
      secondary: "border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)]",
      ghost: "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text)]",
      ai: "border border-[var(--color-ai)] bg-[var(--color-ai-soft)] text-[var(--color-ai)] hover:border-[var(--color-ai-hover)]",
      danger: "bg-[var(--color-danger)] text-white hover:opacity-90",
    },
  }, defaultVariants: { variant: "primary" } },
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyles>;

export function Button({ className, variant, type = "button", ...props }: Props) {
  return <button type={type} className={clsx(buttonStyles({ variant }), className)} {...props} />;
}
