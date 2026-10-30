import { describe, expect, it, vi } from "vitest";

import { enforceCloudflareExportAccess } from "./export-access";

function request(headers: Record<string, string> = {}) {
  return new Request("https://smartpdf.test/api/export", { headers });
}

function limiter(success = true) {
  return { limit: vi.fn(async () => ({ success })) };
}

function browser() {
  return { quickAction: vi.fn(async () => new Response()) };
}

describe("export access", () => {
  it("fails closed when production protection is disabled or unavailable", async () => {
    const result = await enforceCloudflareExportAccess(
      request({ "cf-connecting-ip": "203.0.113.10" }),
      {},
      true,
    );

    expect(result).toEqual({
      allowed: false,
      code: "EXPORT_PROTECTION_UNAVAILABLE",
      status: 503,
    });
  });

  it("does not trust a forged forwarding header without Cloudflare context", async () => {
    const ipLimiter = limiter();
    const routeLimiter = limiter();
    const result = await enforceCloudflareExportAccess(
      request({
        "cf-connecting-ip": "203.0.113.10",
        "x-forwarded-for": "198.51.100.99",
      }),
      {
        BROWSER: browser(),
        PDF_EXPORT_ENABLED: "1",
        PDF_EXPORT_IP_RATE_LIMITER: ipLimiter,
        PDF_EXPORT_ROUTE_RATE_LIMITER: routeLimiter,
      },
      false,
    );

    expect(result.allowed).toBe(false);
    expect(ipLimiter.limit).not.toHaveBeenCalled();
  });

  it("uses only trusted Cloudflare metadata and both distributed quotas", async () => {
    const ipLimiter = limiter();
    const routeLimiter = limiter();
    const browserBinding = browser();
    const result = await enforceCloudflareExportAccess(
      request({
        "cf-connecting-ip": "203.0.113.10",
        "x-forwarded-for": "198.51.100.99",
      }),
      {
        BROWSER: browserBinding,
        PDF_EXPORT_ENABLED: "1",
        PDF_EXPORT_IP_RATE_LIMITER: ipLimiter,
        PDF_EXPORT_ROUTE_RATE_LIMITER: routeLimiter,
      },
      true,
    );

    expect(result).toEqual({
      allowed: true,
      runtime: { kind: "cloudflare", browser: browserBinding },
    });
    expect(ipLimiter.limit).toHaveBeenCalledWith({ key: "pdf-export:203.0.113.10" });
    expect(routeLimiter.limit).toHaveBeenCalledWith({ key: "pdf-export:all-clients" });
  });

  it("denies export when either distributed quota is exhausted", async () => {
    const result = await enforceCloudflareExportAccess(
      request({ "cf-connecting-ip": "203.0.113.10" }),
      {
        BROWSER: browser(),
        PDF_EXPORT_ENABLED: "1",
        PDF_EXPORT_IP_RATE_LIMITER: limiter(false),
        PDF_EXPORT_ROUTE_RATE_LIMITER: limiter(),
      },
      true,
    );

    expect(result).toEqual({ allowed: false, code: "RATE_LIMITED", status: 429 });
  });

  it("fails closed when the Cloudflare Browser Rendering binding is missing", async () => {
    const result = await enforceCloudflareExportAccess(
      request({ "cf-connecting-ip": "203.0.113.10" }),
      {
        PDF_EXPORT_ENABLED: "1",
        PDF_EXPORT_IP_RATE_LIMITER: limiter(),
        PDF_EXPORT_ROUTE_RATE_LIMITER: limiter(),
      },
      true,
    );

    expect(result).toEqual({
      allowed: false,
      code: "EXPORT_PROTECTION_UNAVAILABLE",
      status: 503,
    });
  });
});

describe("production Cloudflare context", () => {
  it("returns 503 within the timeout when the Cloudflare context never resolves", async () => {
    vi.useFakeTimers();
    vi.stubEnv("NODE_ENV", "production");
    vi.doMock("@opennextjs/cloudflare", () => ({ getCloudflareContext: () => new Promise(() => undefined) }));
    try {
      vi.resetModules();
      const { enforceExportAccess } = await import("./export-access");
      const outcome = enforceExportAccess(request({ "cf-connecting-ip": "203.0.113.10" }));
      await vi.advanceTimersByTimeAsync(3_100);
      await expect(outcome).resolves.toEqual({ allowed: false, code: "EXPORT_PROTECTION_UNAVAILABLE", status: 503 });
    } finally {
      vi.useRealTimers();
      vi.unstubAllEnvs();
      vi.doUnmock("@opennextjs/cloudflare");
    }
  });
});
