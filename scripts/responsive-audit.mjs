import { chromium } from "playwright-core";
import { mkdir, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const baseUrl = process.env.SMARTPDF_AUDIT_URL ?? "http://localhost:3000";
const edgePath = process.env.SMARTPDF_BROWSER_PATH ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const outputDirectory = path.join(os.tmpdir(), "smartpdf-responsive-audit");
const viewports = [
  ["android-small", 320, 568], ["android-standard", 360, 800], ["iphone-se", 375, 667],
  ["iphone", 390, 844], ["android-large", 412, 915], ["iphone-plus", 430, 932],
  ["phone-landscape", 844, 390], ["tablet-small", 600, 960], ["ipad-portrait", 768, 1024],
  ["tablet-portrait", 800, 1280], ["ipad-landscape", 1024, 768], ["ipad-pro", 1180, 820],
  ["laptop-small", 1280, 800], ["laptop", 1440, 900], ["desktop", 1920, 1080],
  ["desktop-large", 2560, 1440], ["ultrawide", 3440, 1440],
];
const screenshots = new Set(["android-small", "iphone", "ipad-portrait", "ipad-landscape", "laptop-small", "desktop", "ultrawide"]);
const browserErrors = [];
const auditFailures = [];

function audit(assertion, detail) {
  if (!assertion) auditFailures.push(detail);
}

async function navigate(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.locator("main").first().waitFor({ state: "visible", timeout: 10_000 });
}

async function noHorizontalOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  audit(dimensions.scrollWidth <= dimensions.viewportWidth + 1, `${label}: horizontal overflow (${dimensions.scrollWidth}px > ${dimensions.viewportWidth}px)`);
}

async function paperFitsViewport(page, label) {
  const dimensions = await page.locator(".document-page").evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return { left: bounds.left, right: bounds.right, viewportWidth: window.innerWidth };
  });
  audit(
    dimensions.left >= -1 && dimensions.right <= dimensions.viewportWidth + 1,
    `${label}: preview is visually clipped (left ${Math.round(dimensions.left)}px, right ${Math.round(dimensions.right)}px, viewport ${dimensions.viewportWidth}px)`,
  );
}

async function popoverFitsViewport(page, fieldId, label) {
  const dimensions = await page.locator(`#${fieldId}-month`).evaluate((element) => {
    let current = element;
    while (current && !current.className.includes("max-h-")) current = current.parentElement;
    const bounds = current?.getBoundingClientRect();
    return bounds ? { top: bounds.top, bottom: bounds.bottom, viewportHeight: window.innerHeight } : null;
  });
  audit(
    Boolean(dimensions && dimensions.top >= 11 && dimensions.bottom <= dimensions.viewportHeight - 11),
    `${label}: date picker is outside the viewport`,
  );
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
        transaction.oncomplete = () => { database.close(); resolve(); };
        transaction.onerror = () => { database.close(); reject(transaction.error); };
      };
    });
  }, document);
}

function businessDocument(kind, locale, direction) {
  const createdAt = new Date().toISOString();
  const isQuotation = kind === "quotation";
  return {
    id: kind === "quotation" ? "11111111-1111-4111-8111-111111111111" : "22222222-2222-4222-8222-222222222222",
    ownerId: "local",
    kind,
    schemaVersion: 1,
    title: isQuotation ? "Client proposal — عرض سعر" : "Northwind invoice",
    status: "draft",
    templateId: "signature",
    locale,
    direction,
    paper: "A4",
    revision: 0,
    createdAt,
    updatedAt: createdAt,
    content: {
      issuer: { name: "Northwind Studio", email: "hello@northwind.example", phone: "", address: "Chicago, Illinois", taxId: "" },
      client: { name: locale === "ar" ? "شركة العميل الدولية" : "Contoso Holdings International", email: "finance@contoso.example", phone: "", address: locale === "ar" ? "مسقط، عُمان" : "New York, NY", taxId: "" },
      number: isQuotation ? "Q-2026-001" : "INV-2026-001",
      issueDate: "2026-08-20",
      dueDate: isQuotation ? "" : "2026-09-20",
      validUntil: isQuotation ? "2026-09-20" : undefined,
      currency: "USD",
      lineItems: [{ id: "33333333-3333-4333-8333-333333333333", description: locale === "ar" ? "استراتيجية أعمال وتخطيط تشغيلي" : "Business strategy and operational planning", quantity: 2, unitPriceMinor: 250000 }],
      taxRate: 5,
      discountMinor: 10000,
      notes: locale === "ar" ? "هذه ملاحظة عربية مع SmartPDF باللغة الإنجليزية." : "A deliberately longer note for responsive layout coverage.",
      terms: isQuotation ? (locale === "ar" ? "صالح لمدة 30 يومًا من تاريخ الإصدار." : "Valid for 30 days from the issue date.") : undefined,
    },
  };
}

function cvDocument() {
  const createdAt = new Date().toISOString();
  return {
    id: "44444444-4444-4444-8444-444444444444",
    ownerId: "local",
    kind: "cv",
    schemaVersion: 1,
    title: "Arabic and English resume",
    status: "draft",
    templateId: "signature",
    locale: "ar",
    direction: "rtl",
    paper: "A4",
    revision: 0,
    createdAt,
    updatedAt: createdAt,
    content: {
      profilePhotoDataUrl: "",
      fullName: "المؤيد Al-Sarmi",
      headline: "مدير عمليات — Operations Manager",
      specialization: "إدارة الأعمال والتشغيل",
      email: "almouyad@example.com",
      phone: "+968 9000 0000",
      location: "Muscat, Oman",
      summary: "خبرة في تطوير العمليات وبناء الفرق عبر بيئات عربية وإنجليزية.",
      experiences: [{ id: "55555555-5555-4555-8555-555555555555", company: "شركة مثال الدولية", role: "مدير العمليات", startDate: "2022-01", endDate: "", current: true, bullets: ["السطر الأول\nالسطر الثاني\nThird line"] }],
      education: [],
      skills: ["إدارة الوقت", "Problem solving", "العمل تحت الضغط"],
    },
  };
}

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(outputDirectory, `${name}.png`), fullPage: true });
}

const browser = await chromium.launch({ executablePath: edgePath, headless: true });
const context = await browser.newContext({ deviceScaleFactor: 1 });
const page = await context.newPage();
page.on("pageerror", (error) => browserErrors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error" && !message.text().includes("favicon")) browserErrors.push(message.text());
});
await mkdir(outputDirectory, { recursive: true });

try {
  for (const [name, width, height] of viewports) {
    await page.setViewportSize({ width, height });
    for (const route of ["/en", "/en/app", "/en/app/documents/new"]) {
      await navigate(page, `${baseUrl}${route}`);
      await noHorizontalOverflow(page, `${name} ${route}`);
    }
    if (screenshots.has(name)) {
      await navigate(page, `${baseUrl}/en`);
      await screenshot(page, `landing-${name}`);
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await navigate(page, `${baseUrl}/en`);
  await page.keyboard.press("Tab");
  const firstFocus = await page.evaluate(() => ({
    href: document.activeElement?.getAttribute("href"),
    visible: Boolean(document.activeElement && document.activeElement.getBoundingClientRect().height),
  }));
  audit(firstFocus.href === "#main-content" && firstFocus.visible, "keyboard users cannot reach the skip link first");

  await page.setViewportSize({ width: 1280, height: 800 });
  await navigate(page, `${baseUrl}/en/app`);
  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  await page.waitForTimeout(250);
  const collapsed = await page.locator("aside").evaluate((element) => Math.round(element.getBoundingClientRect().width));
  audit(collapsed <= 48, `desktop sidebar remains too wide when collapsed (${collapsed}px)`);
  await page.getByRole("button", { name: "Expand sidebar" }).click();
  await page.waitForTimeout(250);
  const expanded = await page.locator("aside").evaluate((element) => Math.round(element.getBoundingClientRect().width));
  audit(expanded >= 200, `desktop sidebar does not restore after expand (${expanded}px)`);

  await navigate(page, `${baseUrl}/en/app/documents/new`);
  await page.locator('input[value="cv"]').click({ force: true });
  await page.getByRole("button", { name: "Create and Open Editor" }).click();
  await page.waitForFunction(() => !window.location.pathname.endsWith("/new"));
  const createdCvId = page.url().split("/").at(-1);
  audit(Boolean(createdCvId), "CV creation did not navigate to an editor");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  const mobilePreviewToggle = page.getByRole("tab", { name: "Preview" });
  if (await mobilePreviewToggle.count()) {
    await mobilePreviewToggle.click();
    audit(await page.locator(".document-page").isVisible(), "mobile Preview tab does not expose the document");
    await noHorizontalOverflow(page, "mobile CV editor preview");
    await paperFitsViewport(page, "mobile CV editor preview");
    await screenshot(page, "cv-editor-iphone");
    await page.getByRole("tab", { name: "Edit" }).click();
    audit(await page.locator("input[aria-label='Document title']").isVisible(), "mobile Edit tab does not restore form controls");

    const photo = await readFile(path.join(process.cwd(), "public", "landing", "business-manager-profile.png"));
    await page.locator('input[type="file"]').setInputFiles({ name: "profile.png", mimeType: "image/png", buffer: photo });
    await page.getByRole("dialog", { name: /Crop profile photo/ }).waitFor();
    await noHorizontalOverflow(page, "mobile profile crop dialog");
    await screenshot(page, "profile-crop-iphone");
    await page.keyboard.press("Escape");
    await page.getByRole("dialog", { name: /Crop profile photo/ }).waitFor({ state: "hidden" });

    await page.setViewportSize({ width: 844, height: 390 });
    await page.locator('input[type="file"]').setInputFiles({ name: "profile.png", mimeType: "image/png", buffer: photo });
    const cropDialog = page.getByRole("dialog", { name: /Crop profile photo/ });
    await cropDialog.waitFor();
    const cropBounds = await cropDialog.boundingBox();
    audit(Boolean(cropBounds && cropBounds.height <= 358), "profile crop dialog exceeds the available landscape viewport");
    await screenshot(page, "profile-crop-landscape");
    await page.keyboard.press("Escape");
    await cropDialog.waitFor({ state: "hidden" });
  } else {
    audit(false, `CV editor did not load after creation: ${(await page.locator("body").innerText()).slice(0, 240)}`);
  }

  await navigate(page, `${baseUrl}/en/app/documents/new`);
  await page.locator('input[value="invoice"]').click({ force: true });
  await page.getByRole("button", { name: "Create and Open Editor" }).click();
  await page.waitForFunction(() => !window.location.pathname.endsWith("/new"));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#issueDate").click();
  const visibleSelects = page.locator("select:visible");
  audit(await visibleSelects.count() >= 3, "invoice date picker does not expose month and year controls");
  await page.locator("#issueDate-month").selectOption("0");
  await page.locator("#issueDate-year").selectOption("2025");
  audit(await page.locator("#issueDate-month").inputValue() === "0", "changing the date year resets the selected month");
  await page.locator("#issueDate-day-2025-01-15").click();
  audit((await page.locator("#issueDate").innerText()).includes("January 15, 2025"), "Issue date does not commit a selected day");
  await noHorizontalOverflow(page, "mobile invoice date picker");
  await screenshot(page, "invoice-date-picker-iphone");
  await page.locator("#dueDate").click();
  const dueDay = page.locator('button[role="gridcell"]:not([disabled])').first();
  await dueDay.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  audit(!(await page.locator("#dueDate").innerText()).includes("Select a date"), "Due date cannot be selected with the keyboard");
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 844, height: 390 });
  await page.locator("#issueDate").click();
  await popoverFitsViewport(page, "issueDate", "landscape invoice date picker");
  await noHorizontalOverflow(page, "landscape invoice date picker");
  await screenshot(page, "invoice-date-picker-landscape");
  await page.keyboard.press("Escape");
  for (const input of await page.locator('input[type="number"]').all()) {
    const box = await input.boundingBox();
    audit(Boolean(box && box.height >= 44), "numeric input is below the 44px touch-target minimum");
  }
  const quantityInput = page.locator('input[type="number"]').first();
  await quantityInput.fill("3.5");
  await quantityInput.press("Tab");
  audit(await quantityInput.inputValue() === "3.5", "Quantity does not accept direct keyboard input");

  await page.setViewportSize({ width: 1180, height: 820 });
  await navigate(page, page.url());
  const formBounds = await page.locator("#editor-form").boundingBox();
  const previewBounds = await page.locator("#editor-preview").boundingBox();
  audit(Boolean(formBounds && previewBounds && previewBounds.x > formBounds.x), "large tablet does not present editor and preview side by side");
  await paperFitsViewport(page, "large-tablet invoice preview");
  await noHorizontalOverflow(page, "large-tablet invoice editor");
  await screenshot(page, "invoice-editor-ipad-pro");

  await seedDocument(page, businessDocument("quotation", "en", "ltr"));
  await page.setViewportSize({ width: 1280, height: 800 });
  await navigate(page, `${baseUrl}/en/app/documents/11111111-1111-4111-8111-111111111111`);
  audit(await page.getByText("Quotation details").isVisible(), "legacy quotation editor did not render");
  await noHorizontalOverflow(page, "legacy quotation editor");
  await paperFitsViewport(page, "legacy quotation editor");
  await screenshot(page, "quotation-editor-laptop");

  await seedDocument(page, cvDocument());
  await page.setViewportSize({ width: 390, height: 844 });
  await navigate(page, `${baseUrl}/en/app/documents/44444444-4444-4444-8444-444444444444`);
  const previewToggle = page.getByRole("tab", { name: "Preview" });
  if (await previewToggle.count()) {
    await previewToggle.click();
    const direction = await page.locator(".document-page").getAttribute("dir");
    audit(direction === "rtl", "Arabic CV preview loses RTL direction");
    await noHorizontalOverflow(page, "Arabic/mixed CV editor preview");
    await paperFitsViewport(page, "Arabic/mixed CV editor preview");
    await screenshot(page, "cv-editor-arabic-mixed-iphone");
  } else {
    audit(false, `Arabic/mixed CV editor did not load: ${(await page.locator("body").innerText()).slice(0, 240)}`);
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  await navigate(page, `${baseUrl}/en/app/documents/new`);
  await page.evaluate(() => { document.documentElement.style.fontSize = "20px"; });
  await noHorizontalOverflow(page, "large-text Create Document");
  await page.emulateMedia({ reducedMotion: "no-preference" });
} finally {
  await browser.close();
}

const result = {
  baseUrl,
  viewports: viewports.map(([name, width, height]) => ({ name, width, height })),
  browserErrors: [...new Set(browserErrors)],
  failures: auditFailures,
  screenshots: outputDirectory,
};
console.log(JSON.stringify(result, null, 2));
if (result.browserErrors.length || result.failures.length) process.exitCode = 1;
