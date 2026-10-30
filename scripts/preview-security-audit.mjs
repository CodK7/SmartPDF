const baseUrl = process.env.SMARTPDF_AUDIT_URL;
if (!baseUrl) throw new Error("SMARTPDF_AUDIT_URL is required");
const origin = new URL(baseUrl).origin;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(new URL(baseUrl).protocol === "https:", "Preview audit requires HTTPS");
assert(new URL(baseUrl).hostname.endsWith(".workers.dev"), "Preview audit must target a real Cloudflare workers.dev URL");

function sampleCv(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id: "99999999-9999-4999-8999-999999999999",
    ownerId: "local",
    kind: "cv",
    schemaVersion: 1,
    title: "Cloudflare security audit",
    status: "draft",
    templateId: "signature",
    locale: "ar",
    direction: "rtl",
    paper: "A4",
    revision: 0,
    createdAt: now,
    updatedAt: now,
    content: {
      profilePhotoDataUrl: "",
      fullName: "أحمد السالمي",
      headline: "مدير أعمال",
      specialization: "إدارة الأعمال",
      email: "ahmad@example.com",
      phone: "+968 9000 0000",
      location: "مسقط، عُمان",
      summary: "<script>fetch('http://127.0.0.1/private')</script> نص عربي آمن",
      experiences: [],
      education: [],
      skills: ["إدارة الفرق"],
      ...overrides,
    },
  };
}

async function post(document, headers = {}) {
  return fetch(`${baseUrl}/api/export`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-smartpdf-request": "1",
      origin,
      ...headers,
    },
    body: JSON.stringify(document),
  });
}

const page = await fetch(`${baseUrl}/en`, { redirect: "manual" });
assert(page.ok, `Landing returned ${page.status}`);
assert(page.headers.has("cf-ray"), "Preview response is missing Cloudflare request metadata");
const csp = page.headers.get("content-security-policy") ?? "";
assert(csp.includes("frame-ancestors 'none'"), "CSP frame-ancestors is missing");
assert(csp.includes("object-src 'none'"), "CSP object-src is missing");
const nonce = /script-src[^;]*'nonce-([^']+)'/.exec(csp)?.[1] ?? "";
assert(nonce.length >= 16, "CSP script nonce is missing or invalid");
assert(!/script-src[^;]*'unsafe-inline'/.test(csp), "CSP permits unsafe inline scripts");
const pageHtml = await page.text();
const scriptTags = [...pageHtml.matchAll(/<script\b([^>]*)>/gi)];
assert(scriptTags.length > 0, "Landing did not contain expected Next.js script tags");
assert(
  scriptTags.every(([, attributes]) => attributes.includes(`nonce="${nonce}"`) || attributes.includes(`nonce='${nonce}'`)),
  "A rendered script tag is missing the response CSP nonce",
);
assert(page.headers.get("strict-transport-security")?.includes("max-age=31536000"), "HSTS is missing");
assert(page.headers.get("x-content-type-options") === "nosniff", "X-Content-Type-Options is missing");
assert(page.headers.get("referrer-policy") === "strict-origin-when-cross-origin", "Referrer-Policy is missing");
assert(page.headers.get("permissions-policy")?.includes("microphone=()"), "Permissions-Policy is missing");

const crossOrigin = await fetch(`${baseUrl}/api/export`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-smartpdf-request": "1",
    origin: "https://attacker.invalid",
  },
  body: JSON.stringify(sampleCv()),
});
assert(crossOrigin.status === 403, `Cross-origin export returned ${crossOrigin.status}`);
assert(!crossOrigin.headers.has("access-control-allow-origin"), "Cross-origin export exposed CORS access");

const ssrf = await post(sampleCv({ profilePhotoDataUrl: "http://169.254.169.254/latest/meta-data" }));
assert(ssrf.status === 422, `SSRF-shaped image input returned ${ssrf.status}`);

const xss = await post(sampleCv());
assert(xss.status === 200, `Escaped XSS sample export returned ${xss.status}`);
assert(xss.headers.get("cache-control") === "no-store", "PDF response is cacheable");
assert(xss.headers.get("content-type")?.startsWith("application/pdf"), "PDF response content type is invalid");
assert(xss.headers.get("x-content-type-options") === "nosniff", "PDF response is missing nosniff");
const xssPdf = new Uint8Array(await xss.arrayBuffer());
assert(new TextDecoder("latin1").decode(xssPdf.slice(0, 5)) === "%PDF-", "XSS sample did not return a PDF");
assert(!new TextDecoder("latin1").decode(xssPdf).includes("/JavaScript"), "Exported PDF contains a JavaScript action");

let rateLimited = false;
for (let attempt = 0; attempt < 16; attempt += 1) {
  const response = await post(sampleCv(), { "x-forwarded-for": `198.51.100.${attempt + 1}` });
  if (response.status === 429) {
    const body = await response.json();
    assert(body.error === "RATE_LIMITED", "Rate-limit response exposed an unexpected error");
    rateLimited = true;
    break;
  }
  assert(response.status === 200, `Unexpected export status during rate test: ${response.status}`);
}
assert(rateLimited, "Cloudflare rate limit was not observed; spoofed X-Forwarded-For may have bypassed protection");

console.log("Cloudflare preview security audit passed: headers, CORS, XSS escaping, SSRF rejection, PDF rendering, and rate limiting verified.");
