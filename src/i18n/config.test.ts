import { describe, expect, it } from "vitest";
import { dictionaryFor, directionFor, isLocale, supportedLocales } from "./config";

describe("application locale", () => {
  it("supports English (ltr) and Arabic (rtl)", () => {
    expect(supportedLocales).toEqual(["en", "ar"]);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("ar")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(directionFor("en")).toBe("ltr");
    expect(directionFor("ar")).toBe("rtl");
    expect(dictionaryFor("en").documents).toBe("Documents");
    expect(dictionaryFor("ar").documents).toBe("المستندات");
  });
});
