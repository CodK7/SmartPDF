import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createDocument } from "@/domain/documents/defaults";

import { DocumentPreview } from "./document-preview";

describe("Arabic document preview", () => {
  it("uses Arabic CV labels and readable placeholders", () => {
    const document = createDocument("cv", "ar");
    document.content.summary = "نبذة مختصرة";
    document.content.experiences = [{
      id: crypto.randomUUID(),
      company: "",
      role: "",
      startDate: "2025-01",
      endDate: "",
      current: true,
      bullets: [""],
    }];

    render(<DocumentPreview document={document} />);

    expect(screen.getByText("اسمك الكامل")).toBeInTheDocument();
    expect(screen.getByText("نبذة مهنية")).toBeInTheDocument();
    expect(screen.getByText("المسمى الوظيفي")).toBeInTheDocument();
    expect(screen.getByText(/حتى الآن/)).toBeInTheDocument();
    expect(screen.queryByText("Profile")).not.toBeInTheDocument();
    expect(screen.queryByText("Present")).not.toBeInTheDocument();
  });

  it("uses Arabic business labels", () => {
    const document = createDocument("invoice", "ar");

    render(<DocumentPreview document={document} />);

    expect(screen.getByText("اسم منشأتك")).toBeInTheDocument();
    expect(screen.getByText("اسم العميل")).toBeInTheDocument();
    expect(screen.getByText("الوصف")).toBeInTheDocument();
    expect(screen.getByText("الإجمالي")).toBeInTheDocument();
    expect(screen.queryByText("Bill to")).not.toBeInTheDocument();
  });

  it("renders multiline CV responsibilities as separate list items", () => {
    const document = createDocument("cv", "ar");
    document.content.experiences = [{
      id: crypto.randomUUID(), company: "شركة", role: "مدير أعمال",
      startDate: "2024-01", endDate: "2025-01", current: false,
      bullets: ["السطر الأول\nالسطر الثاني\nالسطر الثالث"],
    }];

    render(<DocumentPreview document={document} />);

    expect(screen.getAllByRole("listitem").map((item) => item.textContent))
      .toEqual(["السطر الأول", "السطر الثاني", "السطر الثالث"]);
  });

  it("renders a local profile photo beside the CV identity", () => {
    const document = createDocument("cv", "en");
    document.content.fullName = "Daniel Brooks";
    document.content.profilePhotoDataUrl = "data:image/jpeg;base64,/9j/2Q==";

    const { container } = render(<DocumentPreview document={document} />);

    const photo = container.querySelector(".cv-photo");
    expect(photo).toHaveAttribute("src", document.content.profilePhotoDataUrl);
    expect(photo?.parentElement).toHaveClass("cv-identity");
  });

  it("gives quotations distinct proposal language and validity metadata", () => {
    const document = createDocument("quotation", "en");
    document.content.validUntil = "2026-09-30";

    render(<DocumentPreview document={document} />);

    expect(screen.getByText("QUOTATION")).toBeInTheDocument();
    expect(screen.getByText("Commercial proposal")).toBeInTheDocument();
    expect(screen.getByText("Quote number")).toBeInTheDocument();
    expect(screen.getByText("Valid until")).toBeInTheDocument();
    expect(screen.getByText("Total proposed amount")).toBeInTheDocument();
    expect(screen.queryByText("Due date")).not.toBeInTheDocument();
  });

  it("shows long business documents as separate A4 preview pages", () => {
    const document = createDocument("quotation", "en");
    document.title = "Long quotation";
    document.content.validUntil = "2026-10-10";
    document.content.lineItems = Array.from({ length: 18 }, (_, index) => ({
      id: crypto.randomUUID(),
      description: `Service ${index + 1}`,
      quantity: 1,
      unitPriceMinor: 10_000,
    }));

    render(<DocumentPreview document={document} />);

    expect(screen.getByLabelText("Long quotation — Document preview — 1/2")).toBeInTheDocument();
    expect(screen.getByLabelText("Long quotation — Document preview — 2/2")).toBeInTheDocument();
    expect(screen.getAllByText("Total proposed amount")).toHaveLength(1);
    expect(screen.getByText("Service 18")).toBeInTheDocument();
  });
});
