import { describe, expect, it, vi } from "vitest";

import { createDocument } from "@/domain/documents/defaults";
import {
  exportDocumentPdf,
  PdfExportBusyError,
  PdfExportUnavailableError,
} from "./pdf-service";
import type { BrowserRunBinding } from "./pdf-runtime";

type PdfQuickActionOptions = Parameters<BrowserRunBinding["quickAction"]>[1];

function pdfResponse(status = 200) {
  return new Response(new TextEncoder().encode("%PDF-1.7\n1 0 obj\n%%EOF"), {
    status,
    headers: { "content-type": "application/pdf" },
  });
}

function runtime(response = pdfResponse()) {
  const quickAction = vi.fn(async (action: "pdf", options: PdfQuickActionOptions) => {
    void action;
    void options;
    return response;
  });
  return {
    quickAction,
    runtime: { kind: "cloudflare" as const, browser: { quickAction } as BrowserRunBinding },
  };
}

describe("Cloudflare PDF service", () => {
  it("uses only the PDF quick action with cache and JavaScript disabled", async () => {
    const document = createDocument("cv", "en");
    document.content.fullName = "Daniel Brooks";
    document.content.summary = "<script>fetch('http://127.0.0.1')</script>";
    const cloudflare = runtime();

    const result = await exportDocumentPdf(document, cloudflare.runtime);

    expect(new TextDecoder().decode(result)).toContain("%PDF-");
    expect(cloudflare.quickAction).toHaveBeenCalledOnce();
    const call = cloudflare.quickAction.mock.calls[0];
    expect(call).toBeDefined();
    if (!call) throw new Error("Expected Browser Rendering to be called");
    const [action, options] = call;
    expect(action).toBe("pdf");
    expect("html" in options).toBe(true);
    if (!("html" in options)) throw new Error("Expected inline HTML rendering");
    expect(options).toMatchObject({
      cacheTTL: 0,
      setJavaScriptEnabled: false,
      allowRequestPattern: ["^data:"],
      pdfOptions: {
        format: "a4",
        printBackground: true,
        preferCSSPageSize: true,
      },
    });
    expect(options.html).not.toContain("<script>");
    expect(options.html).toContain("&lt;script&gt;");
  });

  it("maps renderer saturation to a retryable busy error", async () => {
    const cloudflare = runtime(pdfResponse(429));
    await expect(exportDocumentPdf(createDocument("invoice", "en"), cloudflare.runtime))
      .rejects.toBeInstanceOf(PdfExportBusyError);
  });

  it("rejects malformed and oversized renderer responses", async () => {
    const malformed = runtime(new Response("not a pdf"));
    await expect(exportDocumentPdf(createDocument("quotation", "ar"), malformed.runtime))
      .rejects.toBeInstanceOf(PdfExportUnavailableError);

    const oversized = runtime(new Response("", { headers: { "content-length": String(13 * 1024 * 1024) } }));
    await expect(exportDocumentPdf(createDocument("cv", "ar"), oversized.runtime))
      .rejects.toBeInstanceOf(PdfExportUnavailableError);
  });
});

describe("PDF export deadline", () => {
  it("gives up with an unavailable error instead of hanging when the browser never answers", async () => {
    vi.useFakeTimers();
    try {
      const hung = { kind: "cloudflare" as const, browser: { quickAction: vi.fn(() => new Promise<Response>(() => undefined)) } as BrowserRunBinding };
      const outcome = expect(exportDocumentPdf(createDocument("cv", "en"), hung)).rejects.toBeInstanceOf(PdfExportUnavailableError);
      await vi.advanceTimersByTimeAsync(31_000);
      await outcome;
    } finally {
      vi.useRealTimers();
    }
  });
});
