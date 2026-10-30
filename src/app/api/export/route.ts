import { smartDocumentSchema } from "@/domain/documents/schema";
import { documentEngine } from "@/document-engine/registry";
import { tryAcquireExportSlot } from "@/infrastructure/pdf/export-limiter";
import {
  exportDocumentPdf,
  PdfExportBusyError,
  PdfExportUnavailableError,
} from "@/infrastructure/pdf/pdf-service";
import { enforceExportAccess } from "@/security/export-access";
import { readBoundedJson, validateSameOriginRequest } from "@/security/request-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(code: string, status: number) {
  return Response.json({ error: code }, { status, headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  const requestError = validateSameOriginRequest(request);
  if (requestError) return jsonError(requestError, requestError === "PAYLOAD_TOO_LARGE" ? 413 : 403);
  const access = await enforceExportAccess(request);
  if (!access.allowed) return jsonError(access.code, access.status);

  let document;
  let encodedTitle;
  try {
    const parsed = smartDocumentSchema.safeParse(await readBoundedJson(request));
    if (!parsed.success || parsed.data.ownerId !== "local") return jsonError("INVALID_DOCUMENT", 422);
    const errors = documentEngine.preflight(parsed.data).filter(({ severity }) => severity === "error");
    if (errors.length) return jsonError("DOCUMENT_NOT_READY", 422);
    document = parsed.data;
    encodedTitle = encodeURIComponent((document.title.trim() || "SmartPDF").slice(0, 80));
  } catch (error) {
    const code = error instanceof Error && error.message === "PAYLOAD_TOO_LARGE" ? "PAYLOAD_TOO_LARGE" : "INVALID_DOCUMENT";
    return jsonError(code, code === "PAYLOAD_TOO_LARGE" ? 413 : 422);
  }

  const release = tryAcquireExportSlot();
  if (!release) return jsonError("EXPORT_BUSY", 429);
  try {
    const pdf = await exportDocumentPdf(document, access.runtime);
    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "cache-control": "no-store",
        "content-disposition": "attachment; filename=\"smartpdf-document.pdf\"; filename*=UTF-8''" + encodedTitle + ".pdf",
        "content-type": "application/pdf",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof PdfExportBusyError) return jsonError("PDF_ENGINE_BUSY", 429);
    if (error instanceof PdfExportUnavailableError) return jsonError("PDF_ENGINE_UNAVAILABLE", 503);
    console.error("PDF export failed", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return jsonError("EXPORT_FAILED", 500);
  } finally {
    release();
  }
}
