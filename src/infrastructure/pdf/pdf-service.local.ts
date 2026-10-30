import { constants } from "node:fs";
import { access } from "node:fs/promises";
import { isAbsolute } from "node:path";
import { chromium, type Browser } from "playwright-core";

import type { SmartDocument } from "@/domain/documents/types";
import { loadPdfFontAssets } from "./font-assets";
import { PdfExportUnavailableError } from "./pdf-errors";
import { renderDocumentHtml } from "./render-html";

const EXPORT_TIMEOUT_MS = 25_000;
const WINDOWS_BROWSER_PATHS = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
];

async function executablePath() {
  const configured = process.env.CHROMIUM_EXECUTABLE_PATH;
  const candidates = configured && isAbsolute(configured) ? [configured, ...WINDOWS_BROWSER_PATHS] : WINDOWS_BROWSER_PATHS;
  for (const candidate of candidates) {
    try {
      await access(candidate, constants.X_OK);
      return candidate;
    } catch {
      // Try the next trusted local browser path.
    }
  }
  throw new PdfExportUnavailableError();
}

async function withTimeout<T>(operation: Promise<T>, timeoutMs = EXPORT_TIMEOUT_MS): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(() => reject(new PdfExportUnavailableError()), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function renderPdf(browser: Browser, document: SmartDocument) {
  const context = await browser.newContext({ javaScriptEnabled: false, serviceWorkers: "block" });
  try {
    const page = await context.newPage();
    await page.route("**/*", (route) => {
      const url = route.request().url();
      return url.startsWith("data:") || url.startsWith("about:")
        ? route.continue()
        : route.abort("blockedbyclient");
    });
    const html = renderDocumentHtml(document, await loadPdfFontAssets());
    await page.setContent(html, { waitUntil: "load", timeout: 10_000 });
    await page.emulateMedia({ media: "print" });
    await page.waitForFunction(() => window.document.fonts.status === "loaded", null, { timeout: 5_000 });
    return await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      tagged: true,
      outline: true,
    });
  } finally {
    await context.close();
  }
}

export async function exportLocalDocumentPdf(document: SmartDocument) {
  let browser: Browser | undefined;
  try {
    browser = await withTimeout(
      chromium.launch({
        executablePath: await executablePath(),
        headless: true,
        args: [
          "--disable-background-networking",
          "--disable-component-update",
          "--disable-default-apps",
          "--disable-dev-shm-usage",
          "--no-first-run",
        ],
      }),
      10_000,
    );
    return await withTimeout(renderPdf(browser, document));
  } finally {
    await browser?.close().catch(() => undefined);
  }
}
