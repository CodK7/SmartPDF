const MAX_CONCURRENT_EXPORTS = 2;
let activeExports = 0;

export function tryAcquireExportSlot(): (() => void) | null {
  if (activeExports >= MAX_CONCURRENT_EXPORTS) return null;
  activeExports += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeExports = Math.max(0, activeExports - 1);
  };
}
