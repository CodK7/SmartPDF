import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-smartpdf-locale": "en" }),
}));
vi.mock("next/server", () => ({ connection: vi.fn(async () => undefined) }));

import RootLayout, { metadata } from "./layout";

describe("root layout DOM integrity boundary", () => {
  it("prevents external translation from mutating React-owned nodes", async () => {
    const element = await RootLayout({ children: <main /> }) as ReactElement<{ translate: string; className: string }>;

    expect(element.props.translate).toBe("no");
    expect(element.props.className).toContain("notranslate");
    expect(metadata.other).toMatchObject({ google: "notranslate" });
  });
});
