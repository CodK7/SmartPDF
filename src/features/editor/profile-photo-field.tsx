"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Minus, Plus, Trash, X } from "@phosphor-icons/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/design-system/components/button";
import type { Locale } from "@/domain/documents/types";
import { isWithinProfileImageBudget, readImageDimensions } from "@/security/image-validation";

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_OUTPUT_LENGTH = 280_000;
const FRAME_SIZE = 280;
const OUTPUT_SIZE = 512;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const IMAGE_HEADER_BYTES = 256 * 1024;

const copy = {
  en: { choose: "Add profile photo", change: "Change profile photo", remove: "Remove photo", hint: "JPG, PNG, or WebP · up to 20 MB", title: "Crop profile photo", description: "Move the image and adjust zoom. The CV will use the circular crop.", zoom: "Zoom", cancel: "Cancel", apply: "Use photo", invalid: "Choose a valid JPG, PNG, or WebP image up to 20 MB.", decode: "This image could not be opened safely. Choose another image.", output: "The cropped image is too large. Try a lower zoom or another image." },
  ar: { choose: "إضافة صورة شخصية", change: "تغيير الصورة الشخصية", remove: "حذف الصورة", hint: "JPG أو PNG أو WebP · حتى 20 ميجابايت", title: "اقتصاص الصورة الشخصية", description: "حرّك الصورة واضبط التكبير. ستظهر النتيجة دائرية في السيرة الذاتية.", zoom: "التكبير", cancel: "إلغاء", apply: "استخدام الصورة", invalid: "اختر صورة JPG أو PNG أو WebP صالحة وبحجم لا يتجاوز 20 ميجابايت.", decode: "تعذر فتح هذه الصورة بأمان. اختر صورة أخرى.", output: "الصورة الناتجة كبيرة جدًا. جرّب تكبيرًا أقل أو صورة أخرى." },
} as const;

type ImageSize = { width: number; height: number };
type Offset = { x: number; y: number };

export async function isSafeProfilePhoto(file: File) {
  if (!ALLOWED_TYPES.has(file.type) || file.size <= 0 || file.size > MAX_FILE_BYTES) return false;
  const header = new Uint8Array(await file.slice(0, IMAGE_HEADER_BYTES).arrayBuffer());
  return isWithinProfileImageBudget(readImageDimensions(header, file.type));
}

function metrics(size: ImageSize, zoom: number, frameSize: number) {
  const scale = Math.max(frameSize / size.width, frameSize / size.height) * zoom;
  return { width: size.width * scale, height: size.height * scale, scale };
}

function clampOffset(offset: Offset, size: ImageSize, zoom: number, frameSize: number): Offset {
  const rendered = metrics(size, zoom, frameSize);
  const maxX = Math.max(0, (rendered.width - frameSize) / 2);
  const maxY = Math.max(0, (rendered.height - frameSize) / 2);
  return { x: Math.max(-maxX, Math.min(maxX, offset.x)), y: Math.max(-maxY, Math.min(maxY, offset.y)) };
}

function croppedDataUrl(image: HTMLImageElement, size: ImageSize, zoom: number, offset: Offset, frameSize: number) {
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("CANVAS_UNAVAILABLE");
  const rendered = metrics(size, zoom, frameSize);
  const outputScale = OUTPUT_SIZE / frameSize;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  context.drawImage(image, OUTPUT_SIZE / 2 - rendered.width * outputScale / 2 + offset.x * outputScale, OUTPUT_SIZE / 2 - rendered.height * outputScale / 2 + offset.y * outputScale, rendered.width * outputScale, rendered.height * outputScale);
  for (const quality of [0.88, 0.76, 0.64, 0.52]) {
    const result = canvas.toDataURL("image/jpeg", quality);
    if (result.length <= MAX_OUTPUT_LENGTH) return result;
  }
  throw new Error("OUTPUT_TOO_LARGE");
}

export function ProfilePhotoField({ locale, value, onChange }: { locale: Locale; value: string; onChange: (value: string) => void }) {
  const text = copy[locale];
  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{ x: number; y: number; offset: Offset } | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<ImageSize | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [frameSize, setFrameSize] = useState(FRAME_SIZE);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => { if (sourceUrl) URL.revokeObjectURL(sourceUrl); }, [sourceUrl]);
  useEffect(() => {
    const updateFrameSize = () => {
      const next = window.innerWidth > window.innerHeight && window.innerHeight <= 520 ? 160 : FRAME_SIZE;
      setFrameSize(next);
      setOffset((current) => imageSize ? clampOffset(current, imageSize, zoom, next) : current);
    };
    updateFrameSize();
    window.addEventListener("resize", updateFrameSize);
    return () => window.removeEventListener("resize", updateFrameSize);
  }, [imageSize, zoom]);

  async function loadFile(file: File | undefined) {
    setError("");
    if (!file || !await isSafeProfilePhoto(file)) { setError(text.invalid); return; }
    setImageSize(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setSourceUrl(URL.createObjectURL(file));
    setOpen(true);
  }

  function move(next: Offset) {
    if (imageSize) setOffset(clampOffset(next, imageSize, zoom, frameSize));
  }

  function applyCrop() {
    if (!imageRef.current || !imageSize) return;
    try { onChange(croppedDataUrl(imageRef.current, imageSize, zoom, offset, frameSize)); setOpen(false); setSourceUrl(null); }
    catch (reason) { setError(reason instanceof Error && reason.message === "OUTPUT_TOO_LARGE" ? text.output : text.decode); }
  }

  const compactCrop = frameSize < FRAME_SIZE;
  return <div>
    <input ref={inputRef} className="sr-only" type="file" tabIndex={-1} aria-label={text.choose} accept="image/jpeg,image/png,image/webp" capture="user" onChange={(event) => { void loadFile(event.target.files?.[0]); event.target.value = ""; }} />
    <div className="flex items-center gap-4"><button type="button" aria-label={value ? text.change : text.choose} onClick={() => inputRef.current?.click()} className="focus-ring motion-control relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-subtle)] text-[var(--color-action)] hover:border-[var(--color-action)] hover:bg-[var(--color-action-soft)]">{value ? <Image unoptimized fill sizes="96px" src={value} alt="" aria-hidden="true" className="object-cover" /> : <Plus size={28} aria-hidden="true" />}</button><div><button type="button" onClick={() => inputRef.current?.click()} className="focus-ring motion-control min-h-11 rounded-lg px-2 text-start text-sm font-semibold text-[var(--color-action)] hover:bg-[var(--color-action-soft)]">{value ? text.change : text.choose}</button><p className="text-xs text-[var(--color-text-muted)]">{text.hint}</p>{value ? <button type="button" onClick={() => onChange("")} className="focus-ring motion-control mt-1 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"><Trash size={17} aria-hidden="true" />{text.remove}</button> : null}</div></div>
    {error ? <p role="alert" className="motion-state-entry mt-3 text-sm font-medium text-[var(--color-danger)]">{error}</p> : null}
    <Dialog.Root open={open} onOpenChange={(next) => { setOpen(next); if (!next) setSourceUrl(null); }}>
      <Dialog.Portal><Dialog.Backdrop className="motion-backdrop fixed inset-0 z-50 bg-slate-950/55" /><Dialog.Viewport className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4"><Dialog.Popup className={`motion-dialog max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-white shadow-[0_24px_80px_rgb(15_23_42/.28)] outline-none ${compactCrop ? "p-4" : "p-5 sm:p-6"}`} dir={locale === "ar" ? "rtl" : "ltr"}>
        <div className="flex items-start justify-between gap-4"><div><Dialog.Title className="text-xl font-bold">{text.title}</Dialog.Title><Dialog.Description className={frameSize < FRAME_SIZE ? "sr-only" : "mt-1 text-sm leading-6 text-[var(--color-text-secondary)]"}>{text.description}</Dialog.Description></div><Dialog.Close className="focus-ring motion-control grid size-11 shrink-0 place-items-center rounded-lg hover:bg-[var(--color-surface-subtle)]" aria-label={text.cancel}><X size={20} aria-hidden="true" /></Dialog.Close></div>
        <div role="group" aria-label={text.title} tabIndex={0} onKeyDown={(event) => { const movement: Record<string, Offset> = { ArrowLeft: { x: -5, y: 0 }, ArrowRight: { x: 5, y: 0 }, ArrowUp: { x: 0, y: -5 }, ArrowDown: { x: 0, y: 5 } }; const delta = movement[event.key]; if (delta) { event.preventDefault(); move({ x: offset.x + delta.x, y: offset.y + delta.y }); } }} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); dragRef.current = { x: event.clientX, y: event.clientY, offset }; }} onPointerMove={(event) => { const drag = dragRef.current; if (drag) move({ x: drag.offset.x + event.clientX - drag.x, y: drag.offset.y + event.clientY - drag.y }); }} onPointerUp={() => { dragRef.current = null; }} className={`focus-ring relative mx-auto max-w-full touch-none cursor-move overflow-hidden rounded-full bg-slate-100 shadow-inner ring-1 ring-slate-300 ${compactCrop ? "mt-3" : "mt-6"}`} style={{ width: frameSize, height: frameSize }}>
          {sourceUrl ? <Image ref={imageRef} unoptimized src={sourceUrl} width={imageSize?.width ?? frameSize} height={imageSize?.height ?? frameSize} alt="" draggable={false} onLoad={(event) => { const next = { width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight }; if (next.width && next.height) setImageSize(next); else setError(text.decode); }} onError={() => setError(text.decode)} style={imageSize ? { position: "absolute", maxWidth: "none", width: metrics(imageSize, zoom, frameSize).width, height: metrics(imageSize, zoom, frameSize).height, left: "50%", top: "50%", transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))` } : undefined} /> : null}
        </div>
        <div className={`grid grid-cols-[44px_1fr_44px] items-center gap-2 ${compactCrop ? "mt-3" : "mt-6"}`}><Minus size={18} className="mx-auto text-[var(--color-text-muted)]" aria-hidden="true" /><label className="sr-only" htmlFor="profile-photo-zoom">{text.zoom}</label><input id="profile-photo-zoom" aria-label={text.zoom} type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => { const next = Number(event.target.value); setZoom(next); if (imageSize) setOffset((current) => clampOffset(current, imageSize, next, frameSize)); }} className="h-11 w-full accent-[var(--color-action)]" /><Plus size={18} className="mx-auto text-[var(--color-text-muted)]" aria-hidden="true" /></div>
        <div className={`flex justify-end gap-3 ${compactCrop ? "mt-3" : "mt-6"}`}><Dialog.Close render={<Button variant="secondary" />}>{text.cancel}</Dialog.Close><Button onClick={applyCrop} disabled={!imageSize}>{text.apply}</Button></div>
      </Dialog.Popup></Dialog.Viewport></Dialog.Portal>
    </Dialog.Root>
  </div>;
}
