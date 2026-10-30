import type { SmartDocument } from "@/domain/documents/types";
import { loadPdfFontAssets } from "./font-assets";
import { PdfExportBusyError, PdfExportUnavailableError } from "./pdf-errors";
import type { PdfExportRuntime } from "./pdf-runtime";
import { renderDocumentHtml } from "./render-html";

export { PdfExportBusyError, PdfExportUnavailableError } from "./pdf-errors";

const EXPORT_TIMEOUT_MS = 25_000;
const MAX_PDF_BYTES = 12 * 1024 * 1024;
const PDF_HEADER = [0x25, 0x50, 0x44, 0x46, 0x2d];

function hasPdfSignature(bytes: Uint8Array) {
  return PDF_HEADER.every((value, index) => bytes[index] === value);
}

function hasPdfEndMarker(bytes: Uint8Array) {
  const start = Math.max(0, bytes.length - 1024);
  const tail = new TextDecoder("latin1").decode(bytes.slice(start));
  return tail.includes("%%EOF");
}

async function readBoundedPdf(response: Response) {
  const declaredLength = Number(response.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_PDF_BYTES) throw new PdfExportUnavailableError();

  const reader = response.body?.getReader();
  if (!reader) throw new PdfExportUnavailableError();

  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_PDF_BYTES) throw new PdfExportUnavailableError();
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }

  const pdf = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    pdf.set(chunk, offset);
    offset += chunk.byteLength;
  }

  if (!hasPdfSignature(pdf) || !hasPdfEndMarker(pdf)) throw new PdfExportUnavailableError();
  return pdf;
}

async function exportCloudflareDocumentPdf(
  document: SmartDocument,
  runtime: Extract<PdfExportRuntime, { kind: "cloudflare" }>,
) {
  let response: Response;
  try {
    response = await runtime.browser.quickAction("pdf", {
      html: renderDocumentHtml(document, await loadPdfFontAssets()),
      cacheTTL: 0,
      actionTimeout: EXPORT_TIMEOUT_MS,
      setJavaScriptEnabled: false,
      allowRequestPattern: ["^data:"],
      rejectResourceTypes: ["script", "xhr", "fetch", "websocket", "eventsource", "media"],
      pdfOptions: {
        format: "a4",
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        tagged: true,
        outline: true,
        timeout: EXPORT_TIMEOUT_MS,
      },
    });
  } catch {
    throw new PdfExportUnavailableError();
  }

  if (response.status === 429) throw new PdfExportBusyError();
  if (!response.ok) throw new PdfExportUnavailableError();
  return readBoundedPdf(response);
}

export async function exportDocumentPdf(document: SmartDocument, runtime: PdfExportRuntime) {
  if (runtime.kind === "cloudflare") return exportCloudflareDocumentPdf(document, runtime);

  if (process.env.NODE_ENV === "production") throw new PdfExportUnavailableError();
  const { exportLocalDocumentPdf } = await import("#pdf-local-renderer");
  return exportLocalDocumentPdf(document);
}
