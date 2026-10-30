import { chromium } from "playwright-core";
import { readFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.SMARTPDF_AUDIT_URL ?? "http://localhost:3000";
const edgePath = process.env.SMARTPDF_BROWSER_PATH ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const failures = [];
const browserErrors = [];
const tested = [];

function audit(condition, message) {
  if (!condition) failures.push(message);
}

function durationSeconds(value) {
  return Math.max(...value.split(",").map((part) => Number.parseFloat(part) || 0));
}

async function noOverflow(page, label) {
  const sizes = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
  audit(sizes.content <= sizes.viewport + 1, `${label}: horizontal overflow (${sizes.content}px > ${sizes.viewport}px)`);
}

async function seedCv(page) {
  const now = new Date().toISOString();
  const record = {
    id: "77777777-7777-4777-8777-777777777777",
    ownerId: "local",
    kind: "cv",
    schemaVersion: 1,
    title: "Motion audit resume",
    status: "draft",
    templateId: "signature",
    locale: "en",
    direction: "ltr",
    paper: "A4",
    revision: 0,
    createdAt: now,
    updatedAt: now,
    content: {
      profilePhotoDataUrl: "",
      fullName: "Daniel Brooks",
      headline: "Business Manager",
      specialization: "Operations",
      email: "daniel44@gmail.com",
      phone: "+1 (312) 555-0147",
      location: "Chicago, IL",
      summary: "Business manager focused on reliable operations.",
      experiences: [],
      education: [],
      skills: ["Operations"],
    },
  };
  await page.goto(`${baseUrl}/en/app`, { waitUntil: "networkidle" });
  await page.evaluate(async (documentRecord) => {
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
        transaction.objectStore("documents").put(documentRecord);
        transaction.oncomplete = () => { database.close(); resolve(); };
        transaction.onerror = () => { database.close(); reject(transaction.error); };
      };
    });
  }, record);
}

const browser = await chromium.launch({ executablePath: edgePath, headless: true });
const context = await browser.newContext({ hasTouch: true, deviceScaleFactor: 1 });
const page = await context.newPage();
page.on("pageerror", (error) => browserErrors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error" && !message.text().includes("favicon")) browserErrors.push(message.text());
});

try {
  for (const [name, width, height] of [
    ["mobile", 390, 844],
    ["tablet", 768, 1024],
    ["laptop", 1280, 800],
    ["desktop", 1920, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${baseUrl}/en`, { waitUntil: "networkidle" });
    await noOverflow(page, name);
    tested.push({ name, width, height });
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseUrl}/en`, { waitUntil: "networkidle" });
  const ctaMotion = await page.getByRole("link", { name: "Create a document" }).evaluate((element) => {
    const style = getComputedStyle(element);
    return { property: style.transitionProperty, duration: style.transitionDuration };
  });
  audit(!ctaMotion.property.includes("all"), "Landing CTA uses transition: all");
  audit(durationSeconds(ctaMotion.duration) <= 0.14, `Landing CTA is too slow (${ctaMotion.duration})`);

  await page.goto(`${baseUrl}/en/app`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  const collapsedWidth = await page.locator("aside").evaluate((element) => Math.round(element.getBoundingClientRect().width));
  audit(collapsedWidth <= 48, `Sidebar layout did not update immediately (${collapsedWidth}px)`);
  const collapsedFeedback = await page.getByRole("button", { name: "Expand sidebar" }).evaluate((element) => {
    const style = getComputedStyle(element);
    return { property: style.transitionProperty, duration: style.transitionDuration };
  });
  audit(collapsedFeedback.property.includes("transform") && collapsedFeedback.property.includes("opacity"), "Collapsed sidebar arrow lacks compositor-friendly feedback");
  await page.getByRole("button", { name: "Expand sidebar" }).tap();

  await page.goto(`${baseUrl}/en/app/documents/new`, { waitUntil: "networkidle" });
  await page.locator('input[value="invoice"]').click({ force: true });
  await page.getByRole("button", { name: "Create and Open Editor" }).click();
  await page.waitForFunction(() => !location.pathname.endsWith("/new"));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#issueDate").tap();
  const popoverMotion = await page.locator(".motion-popover").evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      property: style.transitionProperty,
      duration: style.transitionDuration,
      origin: style.getPropertyValue("--transform-origin").trim(),
    };
  });
  audit(popoverMotion.property.includes("transform") && popoverMotion.property.includes("opacity"), "Date picker does not use transform/opacity");
  audit(Boolean(popoverMotion.origin), "Date picker has no trigger-aware transform origin");
  audit(durationSeconds(popoverMotion.duration) <= 0.14, `Date picker is too slow (${popoverMotion.duration})`);
  await page.keyboard.press("Escape");

  await seedCv(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/en/app/documents/77777777-7777-4777-8777-777777777777`, { waitUntil: "networkidle" });
  const nameInput = page.locator("#fullName");
  const updateStarted = Date.now();
  await nameInput.fill("Daniel Brooks Updated");
  await page.getByRole("tab", { name: "Preview" }).tap();
  await page.getByText("Daniel Brooks Updated", { exact: true }).waitFor();
  audit(Date.now() - updateStarted < 500, "Live Preview update is delayed by decorative motion");
  const previewTransition = await page.locator(".document-page").evaluate((element) => getComputedStyle(element).transitionDuration);
  audit(durationSeconds(previewTransition) === 0, "Document page content is animated and may flicker");
  await page.getByRole("tab", { name: "Edit" }).tap();

  const photo = await readFile(path.join(process.cwd(), "public", "landing", "business-manager-profile.png"));
  await page.locator('input[type="file"]').setInputFiles({ name: "profile.png", mimeType: "image/png", buffer: photo });
  const dialog = page.getByRole("dialog", { name: "Crop profile photo" });
  await dialog.waitFor();
  const dialogMotion = await dialog.evaluate((element) => {
    const style = getComputedStyle(element);
    return { property: style.transitionProperty, duration: style.transitionDuration };
  });
  audit(dialogMotion.property.includes("transform") && dialogMotion.property.includes("opacity"), "Crop dialog does not use transform/opacity");
  audit(durationSeconds(dialogMotion.duration) <= 0.18, `Crop dialog is too slow (${dialogMotion.duration})`);
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });

  await page.route("**/api/export", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 220));
    await route.fulfill({ status: 200, contentType: "application/pdf", body: "%PDF-1.4\n%%EOF" });
  });
  await page.getByRole("button", { name: "Export PDF" }).click();
  audit(await page.getByText("Exporting…", { exact: true }).isVisible(), "PDF export does not expose its real busy state");
  await page.getByText("Export PDF", { exact: true }).waitFor();
  await page.unroute("**/api/export");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${baseUrl}/en/app/documents/new`, { waitUntil: "networkidle" });
  const reducedCard = await page.locator('label:has(input[value="cv"])').evaluate((element) => {
    const style = getComputedStyle(element);
    return { duration: style.transitionDuration, transform: style.transform };
  });
  audit(durationSeconds(reducedCard.duration) <= 0.001, `Reduced motion keeps a long control transition (${reducedCard.duration})`);
  await page.evaluate(() => {
    const skeleton = document.createElement("div");
    skeleton.id = "motion-audit-skeleton";
    skeleton.className = "motion-skeleton";
    document.body.append(skeleton);
  });
  const reducedSkeleton = await page.locator("#motion-audit-skeleton").evaluate((element) => getComputedStyle(element).animationName);
  audit(reducedSkeleton === "none", "Skeleton continues animating in reduced-motion mode");
  await page.emulateMedia({ reducedMotion: "no-preference" });
} finally {
  await browser.close();
}

const result = { baseUrl, tested, browserErrors: [...new Set(browserErrors)], failures };
console.log(JSON.stringify(result, null, 2));
if (result.browserErrors.length || result.failures.length) process.exitCode = 1;
