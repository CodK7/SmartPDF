import { describe, expect, it } from "vitest";
import { cvAchievementLines, directionForText } from "./cv-format";

describe("CV text formatting", () => {
  it("keeps each entered achievement line as a separate item", () => {
    expect(cvAchievementLines(["السطر الأول\nالسطر الثاني\r\nالسطر الثالث"]))
      .toEqual(["السطر الأول", "السطر الثاني", "السطر الثالث"]);
  });

  it("detects Arabic, English, and mixed content by its first strong character", () => {
    expect(directionForText("  إدارة الأعمال Business", "ltr")).toBe("rtl");
    expect(directionForText("Business إدارة", "rtl")).toBe("ltr");
  });
});
