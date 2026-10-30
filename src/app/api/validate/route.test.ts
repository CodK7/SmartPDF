import { describe, expect, it } from "vitest";

import { createDocument } from "@/domain/documents/defaults";

import { POST } from "./route";

function validationRequest(body: unknown, origin = "https://smartpdf.test") {
  return new Request("https://smartpdf.test/api/validate", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-smartpdf-request": "1",
      origin,
    },
    body: JSON.stringify(body),
  });
}

describe("document validation route", () => {
  it("rejects malformed untrusted data", async () => {
    const response = await POST(
      validationRequest({ kind: "invoice", ownerId: "another-user" }),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: "INVALID_DOCUMENT",
    });
  });

  it("returns preflight failures without persisting content", async () => {
    const response = await POST(validationRequest(createDocument("invoice", "en")));

    expect(response.status).toBe(422);
    const payload = (await response.json()) as {
      issues: Array<{ code: string }>;
    };
    expect(payload.issues.map(({ code }) => code)).toContain("ISSUER_REQUIRED");
  });

  it("denies cross-origin submissions", async () => {
    const response = await POST(
      validationRequest(createDocument("cv", "en"), "https://attacker.test"),
    );

    expect(response.status).toBe(403);
  });
});
