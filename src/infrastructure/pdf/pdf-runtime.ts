export interface BrowserRunBinding {
  quickAction(action: "pdf", options: BrowserRunPDFOptions): Promise<Response>;
}

export type PdfExportRuntime =
  | { kind: "local" }
  | { kind: "cloudflare"; browser: BrowserRunBinding };
