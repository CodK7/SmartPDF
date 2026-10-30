import type { SmartDocument } from "@/domain/documents/types";
import { PdfExportUnavailableError } from "./pdf-errors";

export function exportLocalDocumentPdf(_document: SmartDocument): Promise<Uint8Array> {
  void _document;
  return Promise.reject(new PdfExportUnavailableError());
}
