import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDocument } from "@/domain/documents/defaults";

const { exportDocumentPdf } = vi.hoisted(() => ({
  exportDocumentPdf: vi.fn(async (document: unknown, runtime: unknown) => {
    void document;
    void runtime;
    return new Uint8Array([37, 80, 68, 70]);
  }),
}));
vi.mock("@/infrastructure/pdf/pdf-service", () => ({
  exportDocumentPdf,
  PdfExportBusyError: class PdfExportBusyError extends Error {},
  PdfExportUnavailableError: class PdfExportUnavailableError extends Error {},
}));

import { POST } from "./route";

function exportRequest(body: unknown, origin = "https://smartpdf.test") {
  return new Request("https://smartpdf.test/api/export", {
    method: "POST",
    headers: { "content-type": "application/json", "x-smartpdf-request": "1", origin },
    body: JSON.stringify(body),
  });
}

describe("PDF export route", () => {
  beforeEach(() => exportDocumentPdf.mockClear());

  it("returns a PDF attachment for a valid owned document", async () => {
    const document = createDocument("cv", "ar");
    document.content.fullName = "المؤيد";
    document.content.headline = "مهندس برمجيات";
    document.content.phone = "+96800000000";
    const response = await POST(exportRequest(document));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toContain("attachment");
    expect(exportDocumentPdf).toHaveBeenCalledOnce();
    expect(exportDocumentPdf.mock.calls[0]?.[1]).toEqual({ kind: "local" });
  });

  it("rejects invalid and cross-origin documents before rendering", async () => {
    expect((await POST(exportRequest({ ownerId: "attacker" }))).status).toBe(422);
    expect((await POST(exportRequest(createDocument("cv", "en"), "https://attacker.test"))).status).toBe(403);
    expect(exportDocumentPdf).not.toHaveBeenCalled();
  });

  it("rejects malformed Unicode and fake JPEG bytes before rendering", async () => {
    const malformedTitle = createDocument("cv", "en");
    malformedTitle.title = "broken\ud800";
    expect((await POST(exportRequest(malformedTitle))).status).toBe(422);

    const fakePhoto = createDocument("cv", "en");
    fakePhoto.content.profilePhotoDataUrl = "data:image/jpeg;base64,SGVsbG8=";
    expect((await POST(exportRequest(fakePhoto))).status).toBe(422);
    expect(exportDocumentPdf).not.toHaveBeenCalled();
  });
});
