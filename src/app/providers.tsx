"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { ToastViewport } from "@/design-system/components/toast";
import type { Direction } from "@/domain/documents/types";

export function Providers({ direction, children }: { direction: Direction; children: React.ReactNode }) {
  return (
    <DirectionProvider direction={direction}>
      {children}
      <ToastViewport direction={direction} />
    </DirectionProvider>
  );
}
