import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { middleware } from "./middleware";

describe("security middleware", () => {
  it("uses a unique nonce CSP without inline script permission", () => {
    const first = middleware(new NextRequest("https://smartpdf.test/en"));
    const second = middleware(new NextRequest("https://smartpdf.test/en"));
    const firstPolicy = first.headers.get("content-security-policy") ?? "";
    const secondPolicy = second.headers.get("content-security-policy") ?? "";

    expect(firstPolicy).toContain("script-src 'self' 'nonce-");
    expect(firstPolicy).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(firstPolicy).toContain("frame-ancestors 'none'");
    expect(firstPolicy).not.toBe(secondPolicy);
  });

  it("applies CSP to locale redirects", () => {
    const response = middleware(new NextRequest("https://smartpdf.test/ar/app"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://smartpdf.test/en/app");
    expect(response.headers.get("content-security-policy")).toContain("object-src 'none'");
  });
});
