import axe from "axe-core";
import { chromium } from "playwright-core";
import { mkdir, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const baseUrl = process.env.SMARTPDF_AUDIT_URL ?? "http://localhost:3000";
const edgePath = process.env.SMARTPDF_BROWSER_PATH ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const outputDirectory = path.join(os.tmpdir(), "smartpdf-full-qa");
const failures = [];
const consoleErrors = [];
const requestFailures = [];
const badResponses = [];
const accessibility = [];
const pdfs = [];
const metrics = {};

function audit(assertion, detail) {
  if (!assertion) failures.push(detail);
}

async function navigate(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.locator("main").first().waitFor({ state: "visible", timeout: 10_000 });
}

async function waitForStableMain(page) {
  await page.waitForLoadState("domcontentloaded");
  await page.locator("main").first().waitFor({ state: "visible", timeout: 10_000 });
  await page.waitForTimeout(150);
}

async function countUnnamedControls(page) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await page.locator("button:visible, a:visible").evaluateAll((elements) => elements.filter((element) => {
        const name = element.getAttribute("aria-label") || element.getAttribute("title") || element.textContent?.trim();
        return !name;
      }).length);
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("Execution context was destroyed") || attempt === 2) throw error;
      await waitForStableMain(page);
    }
  }
  return 0;
}

async function clearDocuments(page) {
  await navigate(page, `${baseUrl}/en/app`);
  await page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open("smartpdf-local", 1);
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore("documents", { keyPath: "id" });
      store.createIndex("updatedAt", "updatedAt");
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction("documents", "readwrite");
      transaction.objectStore("documents").clear();
      transaction.oncomplete = () => { database.close(); resolve(undefined); };
      transaction.onerror = () => { database.close(); reject(transaction.error); };
    };
  }));
  await navigate(page, `${baseUrl}/en/app`);
}

async function seedDocument(page, document) {
  await navigate(page, `${baseUrl}/en/app`);
  await page.evaluate(async (record) => {
    await new Promise((resolve, reject) => {
      const request = indexedDB.open("smartpdf-local", 1);
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore("documents", { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt");
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction("documents", "readwrite");
        transaction.objectStore("documents").put(record);
        transaction.oncomplete = () => { database.close(); resolve(undefined); };
        transaction.onerror = () => { database.close(); reject(transaction.error); };
      };
    });
  }, document);
}

async function storedDocumentCount(page) {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open("smartpdf-local", 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const countRequest = database.transaction("documents", "readonly").objectStore("documents").count();
      countRequest.onsuccess = () => { database.close(); resolve(countRequest.result); };
      countRequest.onerror = () => { database.close(); reject(countRequest.error); };
    };
  }));
}

async function runAccessibility(page, label) {
  await page.addScriptTag({ content: axe.source });
  const result = await page.evaluate(async () => window.axe.run(window.document, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] },
  }));
  const violations = result.violations.map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.length }));
  accessibility.push({ label, violations });
  const blocking = violations.filter(({ impact }) => impact === "serious" || impact === "critical");
  audit(blocking.length === 0, `${label}: blocking accessibility violations ${JSON.stringify(blocking)}`);
}

async function assertNoBadTokens(page, label) {
  const text = await page.locator("body").innerText();
  audit(!/(?:\bundefined\b|\bnull\b|\bNaN\b|\bInfinity\b)/.test(text), `${label}: leaked invalid value into the UI`);
}

async function chooseDate(page, id, year, monthIndex, day) {
  await page.locator(`#${id}`).click();
  await page.locator(`#${id}-month`).selectOption(String(monthIndex));
  await page.locator(`#${id}-year`).selectOption(String(year));
  await page.locator(`#${id}-day-${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`).click();
}

async function exportPdf(page, label, doubleTrigger = false) {
  const output = path.join(outputDirectory, `${label}.pdf`);
  let exportRequests = 0;
  const countRequest = (request) => { if (request.url().endsWith("/api/export")) exportRequests += 1; };
  page.on("request", countRequest);
  const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });
  const button = page.getByRole("button", { name: "Export PDF" });
  if (doubleTrigger) await button.evaluate((element) => { element.click(); element.click(); });
  else await button.click();
  const download = await downloadPromise;
  await download.saveAs(output);
  page.off("request", countRequest);
  audit(!doubleTrigger || exportRequests === 1, `${label}: double activation generated ${exportRequests} export requests`);
  const bytes = await readFile(output);
  audit(bytes.subarray(0, 5).toString() === "%PDF-", `${label}: downloaded artifact is not a PDF`);
  audit(bytes.length > 20_000, `${label}: exported PDF is unexpectedly small (${bytes.length} bytes)`);
  pdfs.push({ label, path: output, bytes: bytes.length });
  return output;
}

function quotationDocument() {
  const now = new Date().toISOString();
  return {
    id: "11111111-1111-4111-8111-111111111111", ownerId: "local", kind: "quotation", schemaVersion: 1,
    title: "Growth proposal — عرض نمو", status: "draft", templateId: "signature", locale: "en", direction: "ltr", paper: "A4", revision: 0, createdAt: now, updatedAt: now,
    content: {
      issuer: { name: "Northwind Advisory", email: "hello@northwind.example", phone: "", address: "Chicago, Illinois", taxId: "" },
      client: { name: "شركة العميل International", email: "client@example.com", phone: "", address: "New York, NY", taxId: "" },
      number: "Q-2026-001", issueDate: "2026-09-10", dueDate: "", validUntil: "2026-10-10", currency: "USD",
      lineItems: Array.from({ length: 18 }, (_, index) => ({ id: `22222222-2222-4222-8${String(index).padStart(3, "0")}-222222222222`, description: `Business service ${index + 1} — خدمة احترافية`, quantity: index + 1, unitPriceMinor: 12_500 })),
      taxRate: 5, discountMinor: 5_000,
      notes: "Implementation schedule\nWeekly status review\nيدعم النص العربي وEnglish 🚀",
      terms: "This quotation is valid for 30 days.\nPayment terms: 50% on approval.",
    },
  };
}

function arabicDocuments() {
  const now = new Date().toISOString();
  const common = { ownerId: "local", schemaVersion: 1, status: "draft", templateId: "signature", locale: "ar", direction: "rtl", paper: "A4", revision: 0, createdAt: now, updatedAt: now };
  return [
    {
      ...common, id: "33333333-3333-4333-8333-333333333333", kind: "cv", title: "السيرة الذاتية - أحمد السالمي",
      content: {
        profilePhotoDataUrl: "", fullName: "أحمد السالمي", headline: "مدير تطوير الأعمال", specialization: "إدارة الأعمال", email: "ahmad@example.com", phone: "+968 9000 0000", location: "مسقط، عُمان",
        summary: "مدير أعمال بخبرة في تطوير العمليات وقيادة الفرق وتحسين الأداء التجاري.",
        experiences: [{ id: "44444444-4444-4444-8444-444444444444", company: "شركة الأفق", role: "مدير تطوير الأعمال", startDate: "2021-01", endDate: "", current: true, bullets: ["رفع كفاءة العمليات بنسبة ٢٠٪", "قاد فريقًا متعدد التخصصات"] }],
        education: [], skills: ["إدارة الفرق", "التخطيط الاستراتيجي", "حل المشكلات"],
      },
    },
    {
      ...common, id: "55555555-5555-4555-8555-555555555555", kind: "invoice", title: "فاتورة خدمات احترافية",
      content: {
        issuer: { name: "مؤسسة الريادة", email: "billing@example.com", phone: "+968 2400 0000", address: "مسقط، سلطنة عُمان", taxId: "OM-1001" },
        client: { name: "شركة العميل", email: "client@example.com", phone: "", address: "صلالة، سلطنة عُمان", taxId: "" },
        number: "INV-AR-001", issueDate: "2026-09-10", dueDate: "2026-09-30", currency: "OMR",
        lineItems: [{ id: "66666666-6666-4666-8666-666666666666", description: "خدمات استشارية وتطوير العمليات", quantity: 2, unitPriceMinor: 125_000 }],
        taxRate: 5, discountMinor: 5_000, notes: "شكرًا لتعاملكم معنا.\nيرجى السداد خلال المدة المحددة.",
      },
    },
    {
      ...common, id: "77777777-7777-4777-8777-777777777777", kind: "quotation", title: "عرض سعر لتطوير الأعمال",
      content: {
        issuer: { name: "مؤسسة الريادة", email: "quotes@example.com", phone: "+968 2400 0000", address: "مسقط، سلطنة عُمان", taxId: "OM-1001" },
        client: { name: "شركة العميل", email: "client@example.com", phone: "", address: "صحار، سلطنة عُمان", taxId: "" },
        number: "Q-AR-001", issueDate: "2026-09-10", dueDate: "", validUntil: "2026-10-10", currency: "OMR",
        lineItems: [{ id: "88888888-8888-4888-8888-888888888888", description: "تحليل العمليات وإعداد خطة التطوير", quantity: 1, unitPriceMinor: 450_000 }],
        taxRate: 5, discountMinor: 0, notes: "يشمل العرض تقريرًا تنفيذيًا.", terms: "العرض صالح لمدة ثلاثين يومًا.\nيبدأ التنفيذ بعد اعتماد العرض.",
      },
    },
  ];
}

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ executablePath: edgePath, headless: true });
const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${error.message}`));
page.on("console", (message) => { if (message.type() === "error" && !message.text().includes("favicon")) consoleErrors.push(`console: ${message.text()}`); });
page.on("requestfailed", (request) => {
  const failure = request.failure()?.errorText ?? "unknown";
  if (request.url().includes("_rsc=") && failure.includes("ERR_ABORTED")) return;
  requestFailures.push(`${request.method()} ${request.url()} — ${failure}`);
});
page.on("response", (response) => { if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`); });

try {
  await clearDocuments(page);

  await navigate(page, `${baseUrl}/en`);
  audit(await page.getByRole("link", { name: /Create a document/i }).isVisible(), "Landing: primary action is not available");
  audit((await page.locator("body").innerText()).includes("A4"), "Landing: A4 badge is missing");
  await runAccessibility(page, "Landing");
  metrics.landingNavigationMs = await page.evaluate(() => Math.round(performance.getEntriesByType("navigation")[0]?.duration ?? 0));
  await page.getByRole("link", { name: "Privacy details" }).click();
  await page.getByRole("heading", { name: "Privacy at SmartPDF" }).waitFor();
  await runAccessibility(page, "Privacy notice");

  await navigate(page, `${baseUrl}/en/app`);
  await page.getByText("No documents yet.").waitFor();
  audit(await page.getByText("No documents yet.").isVisible(), "Workspace: empty state is missing");
  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  audit(await page.getByRole("button", { name: "Expand sidebar" }).isVisible(), "Workspace: collapsed sidebar cannot be expanded");
  await page.getByRole("button", { name: "Expand sidebar" }).click();
  await runAccessibility(page, "Workspace empty state");

  const newDocumentHref = await page.locator('a[href="/en/app/documents/new"]').getAttribute("href");
  audit(newDocumentHref === "/en/app/documents/new", "Workspace: New document link points to the wrong route");
  await navigate(page, `${baseUrl}${newDocumentHref}`);
  audit(await page.locator('input[value="quotation"]').count() === 0, "Create flow: quotation was exposed despite the current product decision");
  await page.locator('input[value="cv"]').check();
  await runAccessibility(page, "Create document");
  await page.getByRole("button", { name: "Create and Open Editor" }).evaluate((element) => { element.click(); element.click(); });
  await page.waitForFunction(() => !window.location.pathname.endsWith("/new"));
  await page.locator("#editor-form").waitFor();
  audit(await storedDocumentCount(page) === 1, "Create flow: double activation created duplicate documents");
  const cvUrl = page.url();

  await page.getByLabel("Document title").fill("Daniel Brooks — السيرة المهنية 🚀");
  await page.getByLabel("Full name").fill("Daniel Brooks المؤيد");
  await page.getByLabel("Professional headline").fill("Business Manager — مدير أعمال");
  await page.getByLabel("Specialization / professional field").fill("Business operations إدارة الأعمال");
  await page.getByLabel("Email").fill("daniel44@gmail.com");
  await page.getByLabel("Phone").fill("+1 202 555 0147");
  await page.getByLabel("Location").fill("Chicago, Illinois");
  const summary = "Business leader improving operations across English and Arabic markets. يقود فرقًا متعددة الثقافات بكفاءة. 🚀";
  await page.getByLabel("Summary").fill(summary);
  await page.getByRole("button", { name: "Add experience" }).click();
  await page.getByLabel("Company").fill("Northwind Holdings");
  await page.getByLabel("Role").fill("Business Operations Manager");
  const monthSelects = page.getByLabel("Month");
  const yearSelects = page.getByLabel("Year");
  await monthSelects.nth(0).selectOption("01");
  await yearSelects.nth(0).selectOption("2022");
  await page.getByLabel("Achievement or responsibility").fill("Improved operating margin by 18%\nLed a 24-person cross-functional team\nأطلق برنامجًا لتطوير العمليات");
  await page.getByRole("checkbox", { name: "I currently work here" }).check();
  audit(await monthSelects.nth(1).isDisabled(), "CV: current-role state does not disable the end date");
  await page.getByRole("button", { name: "Add education" }).click();
  await page.getByLabel("Institution").fill("University of Washington");
  await page.getByLabel("Degree / field of study").fill("BBA, Business Administration");
  await monthSelects.nth(2).selectOption("09");
  await yearSelects.nth(2).selectOption("2015");
  await monthSelects.nth(3).selectOption("06");
  await yearSelects.nth(3).selectOption("2019");
  const skills = page.getByLabel("Skills");
  for (const skill of ["Problem solving", "إدارة الوقت", "Python"]) {
    await skills.fill(skill);
    await skills.press("Enter");
  }

  const photo = await readFile(path.join(process.cwd(), "public", "landing", "business-manager-profile.png"));
  await page.locator('input[type="file"]').setInputFiles({ name: "profile.png", mimeType: "image/png", buffer: photo });
  const cropDialog = page.getByRole("dialog", { name: "Crop profile photo" });
  await cropDialog.waitFor();
  await page.getByRole("slider", { name: "Zoom" }).fill("1.4");
  await page.getByRole("group", { name: "Crop profile photo" }).focus();
  await page.keyboard.press("ArrowRight");
  await page.getByRole("button", { name: "Use photo" }).click();
  audit(await page.locator(".cv-photo").isVisible(), "CV: cropped photo is not visible in preview");

  await page.waitForTimeout(1_100);
  const inputStarted = performance.now();
  await page.getByLabel("Full name").fill("Daniel Brooks المؤيد السالمي");
  await page.locator(".cv-name").waitFor();
  await page.waitForFunction(() => document.querySelector(".cv-name")?.textContent?.includes("السالمي"));
  metrics.previewUpdateMs = Math.round(performance.now() - inputStarted);
  audit(metrics.previewUpdateMs < 500, `CV: preview update took ${metrics.previewUpdateMs}ms`);
  await page.screenshot({ path: path.join(outputDirectory, "cv-preview.png"), fullPage: true });
  await runAccessibility(page, "CV editor");
  await assertNoBadTokens(page, "CV editor");

  await page.waitForTimeout(1_100);
  await navigate(page, cvUrl);
  audit(await page.getByLabel("Full name").inputValue() === "Daniel Brooks المؤيد السالمي", "CV: latest autosaved value did not survive reload");
  audit((await page.getByLabel("Achievement or responsibility").inputValue()).split("\n").length === 3, "CV: multiline responsibilities did not survive reload");
  audit(await page.getByLabel("Institution").inputValue() === "University of Washington", "CV: education did not survive reload");
  await exportPdf(page, "cv-mixed", true);

  await navigate(page, `${baseUrl}/en/app/documents/new`);
  await page.locator('input[value="invoice"]').check({ force: true });
  await page.getByRole("button", { name: "Create and Open Editor" }).click();
  await page.waitForFunction(() => !window.location.pathname.endsWith("/new"));
  await page.locator("#editor-form").waitFor();
  await page.getByLabel("Document title").fill("Northwind Invoice 2026");
  await page.getByLabel("Invoice number").fill("INV-2026-0044");
  await page.locator("#issuer-name").fill("Northwind Advisory");
  await page.locator("#issuer-email").fill("billing@northwind.example");
  await page.locator("#issuer-address").fill("Chicago, Illinois\nUnited States");
  await page.locator("#client-name").fill("Contoso International");
  await page.locator("#client-email").fill("accounts@contoso.example");
  await page.locator("#client-address").fill("New York, NY");
  await chooseDate(page, "issueDate", 2026, 8, 10);
  await chooseDate(page, "dueDate", 2026, 8, 30);
  await chooseDate(page, "issueDate", 2026, 9, 10);
  audit((await page.locator("#dueDate").innerText()).includes("Select date"), "Invoice: moving issue date past due date did not clear the invalid due date");
  await chooseDate(page, "issueDate", 2026, 8, 10);
  await chooseDate(page, "dueDate", 2026, 8, 30);
  await page.getByLabel("Description").fill("Business process optimization — تحسين العمليات");
  const quantity = page.getByLabel("Quantity");
  await quantity.fill("-5");
  await quantity.blur();
  audit(await quantity.inputValue() === "0.01", "Invoice: negative quantity was not normalized safely");
  await quantity.fill("2.5");
  await page.getByLabel("Unit price").fill("123.45");
  await page.getByLabel("Tax %").fill("10");
  await page.getByLabel("Discount").fill("5");
  await page.getByLabel("Notes").fill("Thank you.\nشكرًا لتعاملكم معنا.");
  await page.getByRole("button", { name: "Add line item" }).click();
  audit(await page.getByLabel("Description").count() === 2, "Invoice: add line item does not work");
  await page.getByRole("button", { name: "Remove" }).last().click();
  audit(await page.getByLabel("Description").count() === 1, "Invoice: remove line item does not work");
  await assertNoBadTokens(page, "Invoice editor");
  await runAccessibility(page, "Invoice editor");
  await page.screenshot({ path: path.join(outputDirectory, "invoice-preview.png"), fullPage: true });
  await exportPdf(page, "invoice");

  const quotation = quotationDocument();
  await seedDocument(page, quotation);
  await navigate(page, `${baseUrl}/en/app/documents/${quotation.id}`);
  audit(await page.getByText("Quotation details").isVisible(), "Quotation: distinct editor heading is missing");
  audit(await page.getByText("Total proposed amount").isVisible(), "Quotation: proposed amount label is missing");
  audit(await page.getByLabel("Valid until").isVisible(), "Quotation: validity field is missing");
  audit(await page.getByLabel("Terms / Conditions").inputValue() === quotation.content.terms, "Quotation: terms did not load");
  const quotationPageHeights = await page.locator(".document-page").evaluateAll((pages) => pages.map((page) => page.offsetHeight));
  audit(quotationPageHeights.length === 2, `Quotation: preview has ${quotationPageHeights.length} pages while export has 2`);
  audit(quotationPageHeights.every((height) => height <= 1124), `Quotation: preview page content overflows A4 (${quotationPageHeights.join(", ")}px)`);
  await assertNoBadTokens(page, "Quotation editor");
  await runAccessibility(page, "Quotation editor");
  await page.screenshot({ path: path.join(outputDirectory, "quotation-preview.png"), fullPage: true });
  await exportPdf(page, "quotation-long");

  for (const document of arabicDocuments()) {
    await seedDocument(page, document);
    await navigate(page, `${baseUrl}/en/app/documents/${document.id}`);
    audit(await page.locator('.document-page[dir="rtl"]').isVisible(), `${document.kind}: Arabic RTL preview direction is missing`);
    await exportPdf(page, `${document.kind}-arabic-rtl`);
  }

  await navigate(page, `${baseUrl}/en/app`);
  await page.getByText("Growth proposal — عرض نمو").waitFor();
  audit(await page.getByText("Daniel Brooks — السيرة المهنية 🚀").isVisible(), "Workspace: CV title is missing after reload");
  audit(await page.getByText("Northwind Invoice 2026").isVisible(), "Workspace: invoice title is missing after reload");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete: Northwind Invoice 2026" }).click();
  await navigate(page, `${baseUrl}/en/app`);
  audit(await page.getByText("Northwind Invoice 2026").count() === 0, "Workspace: deleted document returned after reload");
  await page.goBack({ waitUntil: "domcontentloaded" });
  await waitForStableMain(page);
  await page.goForward({ waitUntil: "domcontentloaded" });
  await waitForStableMain(page);
  await assertNoBadTokens(page, "Workspace navigation");

  const unnamedControls = await countUnnamedControls(page);
  audit(unnamedControls === 0, `Workspace: ${unnamedControls} visible controls have no accessible name`);
} finally {
  await browser.close();
}

const result = {
  baseUrl,
  outputDirectory,
  failures,
  consoleErrors: [...new Set(consoleErrors)],
  requestFailures: [...new Set(requestFailures)],
  badResponses: [...new Set(badResponses)],
  accessibility,
  pdfs,
  metrics,
};
console.log(JSON.stringify(result, null, 2));
if (failures.length || consoleErrors.length || requestFailures.length || badResponses.length) process.exitCode = 1;
