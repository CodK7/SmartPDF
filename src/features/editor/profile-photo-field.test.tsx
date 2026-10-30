import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isSafeProfilePhoto, ProfilePhotoField } from "./profile-photo-field";

function file(bytes: number[], type: string, name = "profile") {
  return new File([new Uint8Array(bytes)], name, { type });
}

function jpegBytes(width = 640, height = 480, size = 32) {
  const bytes = new Uint8Array(size);
  bytes.set([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08]);
  bytes[7] = height >> 8; bytes[8] = height & 0xff;
  bytes[9] = width >> 8; bytes[10] = width & 0xff;
  return bytes;
}

function pngBytes(width = 640, height = 480) {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  bytes.set([0x49, 0x48, 0x44, 0x52], 12);
  new DataView(bytes.buffer).setUint32(16, width);
  new DataView(bytes.buffer).setUint32(20, height);
  return bytes;
}

function webpBytes(width = 640, height = 480) {
  const bytes = new Uint8Array(30);
  bytes.set([0x52, 0x49, 0x46, 0x46], 0);
  bytes.set([0x57, 0x45, 0x42, 0x50], 8);
  bytes.set([0x56, 0x50, 0x38, 0x58], 12);
  const encodedWidth = width - 1;
  const encodedHeight = height - 1;
  bytes.set([encodedWidth & 0xff, (encodedWidth >> 8) & 0xff, (encodedWidth >> 16) & 0xff], 24);
  bytes.set([encodedHeight & 0xff, (encodedHeight >> 8) & 0xff, (encodedHeight >> 16) & 0xff], 27);
  return bytes;
}

function jpegOfSize(bytes: number) {
  return new File([jpegBytes(640, 480, bytes)], "profile.jpg", { type: "image/jpeg" });
}

describe("profile photo safety", () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([
    ["image/jpeg", [...jpegBytes()]],
    ["image/png", [...pngBytes()]],
    ["image/webp", [...webpBytes()]],
  ])("accepts a valid %s signature", async (type, bytes) => {
    await expect(isSafeProfilePhoto(file(bytes as number[], type as string))).resolves.toBe(true);
  });

  it("accepts 20 MB and rejects spoofed, unsupported, empty, and larger uploads", async () => {
    await expect(isSafeProfilePhoto(file([1, 2, 3, 4], "image/jpeg"))).resolves.toBe(false);
    await expect(isSafeProfilePhoto(file([0x3c, 0x73, 0x76, 0x67], "image/svg+xml", "profile.svg"))).resolves.toBe(false);
    await expect(isSafeProfilePhoto(file([], "image/png"))).resolves.toBe(false);
    await expect(isSafeProfilePhoto(jpegOfSize(20 * 1024 * 1024))).resolves.toBe(true);
    await expect(isSafeProfilePhoto(jpegOfSize(20 * 1024 * 1024 + 1))).resolves.toBe(false);
  });

  it("rejects extreme pixel dimensions before browser decode", async () => {
    await expect(isSafeProfilePhoto(file([...pngBytes(12_000, 12_000)], "image/png"))).resolves.toBe(false);
    await expect(isSafeProfilePhoto(file([...jpegBytes(12_001, 1)], "image/jpeg"))).resolves.toBe(false);
  });

  it("opens the crop dialog and supports zoom, keyboard positioning, and local JPEG output", async () => {
    const onChange = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:profile") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ fillStyle: "", fillRect: vi.fn(), drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/jpeg;base64,/9j/2Q==");
    const user = userEvent.setup();
    const { container } = render(<ProfilePhotoField locale="en" value="" onChange={onChange} />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();

    await user.upload(input!, file([...jpegBytes()], "image/jpeg", "profile.jpg"));
    const dialog = screen.getByRole("dialog");
    const image = dialog.querySelector<HTMLImageElement>('img[src="blob:profile"]');
    expect(image).not.toBeNull();
    Object.defineProperty(image!, "naturalWidth", { configurable: true, value: 640 });
    Object.defineProperty(image!, "naturalHeight", { configurable: true, value: 480 });
    fireEvent.load(image!);
    await waitFor(() => expect(screen.getByRole("button", { name: "Use photo" })).toBeEnabled());

    fireEvent.change(screen.getByRole("slider", { name: "Zoom" }), { target: { value: "2" } });
    expect(screen.getByRole("slider", { name: "Zoom" })).toHaveValue("2");
    fireEvent.keyDown(screen.getByRole("group", { name: "Crop profile photo" }), { key: "ArrowRight" });
    await waitFor(() => expect(image!.style.transform).toContain("5px"));

    await user.click(screen.getByRole("button", { name: "Use photo" }));
    expect(onChange).toHaveBeenCalledWith("data:image/jpeg;base64,/9j/2Q==");
  });
});
