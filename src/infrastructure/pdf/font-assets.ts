import { EMBEDDED_PDF_FONT_ASSETS } from "./generated-font-assets";

export interface PdfFontAssets {
  displayLatin: string;
  displayArabic: string;
  bodyLatin: string;
  bodyArabic: string;
}

export function loadPdfFontAssets(): Promise<PdfFontAssets> {
  return Promise.resolve(EMBEDDED_PDF_FONT_ASSETS);
}
