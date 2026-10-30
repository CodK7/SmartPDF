import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { createDocument } from "@/domain/documents/defaults";
import type { CvDocument } from "@/domain/documents/types";
import { CvForm } from "./cv-form";

function CvHarness({ onUpdate }: { onUpdate: (document: CvDocument) => void }) {
  const [document, setDocument] = useState(() => createDocument("cv", "en"));
  return <CvForm document={document} locale="en" update={(next) => { setDocument(next); onUpdate(next); }} />;
}

describe("CV form completeness", () => {
  it("preserves multiline responsibilities and edits current experience and education", async () => {
    const user = userEvent.setup();
    let latest = createDocument("cv", "en");
    render(<CvHarness onUpdate={(document) => { latest = document; }} />);

    await user.click(screen.getByRole("button", { name: "Add experience" }));
    await user.type(screen.getByLabelText("Achievement or responsibility"), "First line{enter}Second line{enter}السطر الثالث");
    expect(latest.content.experiences[0]?.bullets).toEqual(["First line", "Second line", "السطر الثالث"]);

    const current = screen.getByRole("checkbox", { name: "I currently work here" });
    await user.click(current);
    expect(latest.content.experiences[0]).toMatchObject({ current: true, endDate: "" });
    expect(screen.getAllByLabelText("Month")[1]).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Add education" }));
    await user.type(screen.getByLabelText("Institution"), "University of Washington");
    await user.type(screen.getByLabelText("Degree / field of study"), "Business Administration");
    expect(latest.content.education[0]).toMatchObject({
      institution: "University of Washington",
      degree: "Business Administration",
    });
  });
});
