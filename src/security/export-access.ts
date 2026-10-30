import { getCloudflareContext } from "@opennextjs/cloudflare";

import type { BrowserRunBinding, PdfExportRuntime } from "@/infrastructure/pdf/pdf-runtime";
import { consumeRateLimit } from "./request-guard";

const LOCAL_EXPORT_LIMIT = 8;
const CONTEXT_TIMEOUT_MS = 3_000;
const TRUSTED_IP_PATTERN = /^[0-9a-f:.]{3,45}$/i;

interface RateLimitBinding {
  limit(input: { key: string }): Promise<{ success: boolean }>;
}

interface ExportBindings {
  BROWSER?: BrowserRunBinding;
  PDF_EXPORT_ENABLED?: string;
  PDF_EXPORT_IP_RATE_LIMITER?: RateLimitBinding;
  PDF_EXPORT_ROUTE_RATE_LIMITER?: RateLimitBinding;
}

type ExportAccessResult =
  | { allowed: true; runtime: PdfExportRuntime }
  | { allowed: false; code: "EXPORT_PROTECTION_UNAVAILABLE" | "RATE_LIMITED"; status: 429 | 503 };

export async function enforceCloudflareExportAccess(
  request: Request,
  env: ExportBindings,
  hasCloudflareRequestContext: boolean,
): Promise<ExportAccessResult> {
  const clientIp = request.headers.get("cf-connecting-ip")?.trim() ?? "";
  const ipLimiter = env.PDF_EXPORT_IP_RATE_LIMITER;
  const routeLimiter = env.PDF_EXPORT_ROUTE_RATE_LIMITER;

  if (
    env.PDF_EXPORT_ENABLED !== "1" ||
    !hasCloudflareRequestContext ||
    !TRUSTED_IP_PATTERN.test(clientIp) ||
    !ipLimiter ||
    !routeLimiter ||
    !env.BROWSER ||
    typeof env.BROWSER.quickAction !== "function"
  ) {
    return { allowed: false, code: "EXPORT_PROTECTION_UNAVAILABLE", status: 503 };
  }

  const [clientQuota, routeQuota] = await Promise.all([
    ipLimiter.limit({ key: `pdf-export:${clientIp}` }),
    routeLimiter.limit({ key: "pdf-export:all-clients" }),
  ]);

  if (!clientQuota.success || !routeQuota.success) {
    return { allowed: false, code: "RATE_LIMITED", status: 429 };
  }

  return { allowed: true, runtime: { kind: "cloudflare", browser: env.BROWSER } };
}

export async function enforceExportAccess(request: Request): Promise<ExportAccessResult> {
  if (process.env.NODE_ENV !== "production") {
    return consumeRateLimit(request, "pdf-export", LOCAL_EXPORT_LIMIT)
      ? { allowed: true, runtime: { kind: "local" } }
      : { allowed: false, code: "RATE_LIMITED", status: 429 };
  }

  try {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const context = await Promise.race([
      getCloudflareContext({ async: true }),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("CLOUDFLARE_CONTEXT_TIMEOUT")), CONTEXT_TIMEOUT_MS); }),
    ]).finally(() => clearTimeout(timer));
    return enforceCloudflareExportAccess(
      request,
      context.env as ExportBindings,
      Boolean(context.cf),
    );
  } catch {
    return { allowed: false, code: "EXPORT_PROTECTION_UNAVAILABLE", status: 503 };
  }
}
