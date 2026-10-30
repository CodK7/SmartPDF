import { describe, expect, it } from "vitest";
import { dictionaryFor, directionFor, isLocale, supportedLocales } from "./config";

describe("application locale", () => {
  it("exposes English as the only application language", () => {
    expect(supportedLocales).toEqual(["en"]);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("ar")).toBe(false);
    expect(directionFor("en")).toBe("ltr");
    expect(dictionaryFor("en").documents).toBe("Documents");
  });
});
