"use client";

import { X } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import type { Direction } from "@/domain/documents/types";

type ToastTone = "success" | "error";
type ToastItem = { id: number; message: string; tone: ToastTone };
type ToastListener = (item: ToastItem) => void;

const listeners = new Set<ToastListener>();
let nextToastId = 0;

function publish(message: string, tone: ToastTone) {
  const item = { id: ++nextToastId, message, tone };
  for (const listener of listeners) listener(item);
}

export const toast = {
  success: (message: string) => publish(message, "success"),
  error: (message: string) => publish(message, "error"),
};

export function ToastViewport({ direction }: { direction: Direction }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const receive: ToastListener = (item) => {
      setItems((current) => [...current.slice(-2), item]);
      const timer = setTimeout(() => {
        setItems((current) => current.filter(({ id }) => id !== item.id));
        timers.delete(timer);
      }, 4_000);
      timers.add(timer);
    };
    listeners.add(receive);
    return () => {
      listeners.delete(receive);
      for (const timer of timers) clearTimeout(timer);
    };
  }, []);

  const closeLabel = direction === "rtl" ? "إغلاق الإشعار" : "Dismiss notification";
  return (
    <div
      className={`pointer-events-none fixed bottom-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2 ${direction === "rtl" ? "left-4" : "right-4"}`}
      dir={direction}
      aria-live="polite"
      aria-relevant="additions"
    >
      {items.map((item) => (
        <div
          key={item.id}
          role={item.tone === "error" ? "alert" : "status"}
          className={`motion-state-entry pointer-events-auto flex min-h-12 items-center gap-3 rounded-xl border bg-white px-4 py-3 text-sm font-semibold shadow-lg ${item.tone === "error" ? "border-red-200 text-red-800" : "border-emerald-200 text-emerald-900"}`}
        >
          <span className="min-w-0 flex-1">{item.message}</span>
          <button
            type="button"
            aria-label={closeLabel}
            className="focus-ring motion-control grid size-10 shrink-0 place-items-center rounded-lg hover:bg-black/5"
            onClick={() => setItems((current) => current.filter(({ id }) => id !== item.id))}
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
