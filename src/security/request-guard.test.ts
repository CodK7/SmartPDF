import { describe, expect, it } from "vitest";

import { consumeRateLimit, readBoundedJson, validateSameOriginRequest } from "./request-guard";

function request(body: string, origin = "https://smartpdf.test") {
  return new Request("https://smartpdf.test/api/validate", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-smartpdf-request": "1",
      origin,
    },
    body,
  });
}

describe("request guard", () => {
  it("accepts a marked same-origin JSON request", () => {
    expect(validateSameOriginRequest(request("{}"))).toBeNull();
  });

  it("rejects a cross-origin request", () => {
    expect(
      validateSameOriginRequest(request("{}", "https://attacker.test")),
    ).toBe("INVALID_ORIGIN");
  });

  it("rejects an oversized streaming body before parsing", async () => {
    await expect(
      readBoundedJson(
        request(JSON.stringify({ value: "x".repeat(513 * 1024) })),
      ),
    ).rejects.toThrow("PAYLOAD_TOO_LARGE");
  });

  it("parses bounded JSON without coercing it", async () => {
    await expect(readBoundedJson(request('{"safe":true}'))).resolves.toEqual({
      safe: true,
    });
  });

  it("keeps expensive-operation rate limits isolated by scope", () => {
    const guarded = request("{}");
    expect(consumeRateLimit(guarded, "pdf-test", 1)).toBe(true);
    expect(consumeRateLimit(guarded, "pdf-test", 1)).toBe(false);
    expect(consumeRateLimit(guarded, "validation-test", 1)).toBe(true);
  });

  it("cannot reset a local quota by rotating forwarding headers", () => {
    const first = new Request("https://smartpdf.test/api/validate", {
      headers: { "x-forwarded-for": "198.51.100.10" },
    });
    const rotated = new Request("https://smartpdf.test/api/validate", {
      headers: { "x-forwarded-for": "198.51.100.11" },
    });

    expect(consumeRateLimit(first, "header-bypass-test", 1)).toBe(true);
    expect(consumeRateLimit(rotated, "header-bypass-test", 1)).toBe(false);
  });
});
