import { describe, expect, it } from "vitest";
import { createDocument } from "@/domain/documents/defaults";
import { escapeHtml, renderDocumentHtml } from "./render-html";
import { CV_DOCUMENT_CSS } from "@/document-engine/cv-visual-spec";

const fonts = { displayLatin: "", displayArabic: "", bodyLatin: "", bodyArabic: "" };

describe("PDF HTML renderer", () => {
  it("escapes every untrusted text field and emits A4 print settings", () => {
    const document = createDocument("cv", "ar");
    document.content.fullName = '<script>alert("x")</script>';
    document.content.headline = "مهندس برمجيات";
    document.content.phone = "+96800000000";
    document.content.specialization = "الأمن & الجودة";
    const html = renderDocumentHtml(document, fonts);

    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("الأمن &amp; الجودة");
    expect(html).toContain("@page{size:A4");
    expect(html).toContain('dir="rtl"');
  });

  it("escapes all HTML-sensitive characters", () => {
    expect(escapeHtml('&<>"\'')).toBe("&amp;&lt;&gt;&quot;&#39;");
  });

  it("uses the shared CV visual spec and preserves responsibility lines", () => {
    const document = createDocument("cv", "en");
    document.content.experiences = [{
      id: crypto.randomUUID(), company: "Harbor & Cole", role: "Business Manager",
      startDate: "2021-01", endDate: "", current: true,
      bullets: ["First responsibility\nSecond responsibility\nالمسؤولية الثالثة"],
    }];
    const html = renderDocumentHtml(document, fonts);

    expect(html).toContain(CV_DOCUMENT_CSS);
    expect(html.match(/<li dir="ltr">/g)).toHaveLength(2);
    expect(html.match(/<li dir="rtl">/g)).toHaveLength(1);
    expect(html).toContain('First responsibility</li><li dir="ltr">Second responsibility');
    expect(html).toContain("المسؤولية الثالثة");
  });

  it("keeps the validated profile photo in the PDF renderer", () => {
    const document = createDocument("cv", "en");
    document.content.profilePhotoDataUrl = "data:image/jpeg;base64,/9j/2Q==";

    const html = renderDocumentHtml(document, fonts);

    expect(html).toContain('class="cv-photo"');
    expect(html).toContain(document.content.profilePhotoDataUrl);
  });

  it("renders quotation-specific PDF labels instead of invoice language", () => {
    const document = createDocument("quotation", "en");
    document.content.validUntil = "2026-09-30";
    const html = renderDocumentHtml(document, fonts);

    expect(html).toContain("QUOTATION");
    expect(html).toContain("Commercial proposal");
    expect(html).toContain("Quote number");
    expect(html).toContain("Valid until");
    expect(html).toContain("Total proposed amount");
    expect(html).not.toContain("Due date");
  });
});
