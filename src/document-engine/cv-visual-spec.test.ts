import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CV_DOCUMENT_CSS } from "./cv-visual-spec";

describe("CV document CSS", () => {
  it("keeps the preview stylesheet identical to the PDF renderer CSS", () => {
    const css = readFileSync(resolve(process.cwd(), "src/document-engine/cv-document.css"), "utf8").replace(/\r?\n/g, "");
    expect(css).toBe(CV_DOCUMENT_CSS);
  });

  it("shows bullet markers for achievements", () => {
    expect(CV_DOCUMENT_CSS).toContain("list-style:disc");
  });
});
