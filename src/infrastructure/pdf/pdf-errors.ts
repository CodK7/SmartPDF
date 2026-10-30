export class PdfExportUnavailableError extends Error {
  constructor() {
    super("PDF_EXPORT_UNAVAILABLE");
    this.name = "PdfExportUnavailableError";
  }
}

export class PdfExportBusyError extends Error {
  constructor() {
    super("PDF_EXPORT_BUSY");
    this.name = "PdfExportBusyError";
  }
}
