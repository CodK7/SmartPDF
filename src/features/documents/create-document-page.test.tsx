import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const createDocument = vi.fn(async () => ({ id: "33333333-3333-4333-8333-333333333333" }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("./workspace-store", () => ({
  useWorkspaceStore: (selector: (state: { createDocument: typeof createDocument }) => unknown) => selector({ createDocument }),
}));

import { CreateDocumentPage } from "./create-document-page";

describe("create document flow", () => {
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it("can be mounted and closed repeatedly without DOM removal errors", () => {
    for (let index = 0; index < 12; index += 1) {
      const view = render(<CreateDocumentPage locale="en" />);
      view.unmount();
    }
  });

  it("shows CV and Invoice plus a document language choice, without quotation or template selectors", () => {
    render(<CreateDocumentPage locale="en" />);
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    expect(screen.getByRole("radio", { name: /CV \/ Resume/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Invoice/i })).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: /Quotation/i })).not.toBeInTheDocument();
    expect(screen.getByText("Document language")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "English" })).toBeChecked();
    expect(screen.queryByText("Template")).not.toBeInTheDocument();
    expect(screen.queryByText("Professional")).not.toBeInTheDocument();
    expect(screen.queryByText("Editorial")).not.toBeInTheDocument();
    expect(screen.getByText("SmartPDF")).toHaveClass("display-type");
  });

  it.each([
    ["CV / Resume", "cv"],
    ["Invoice", "invoice"],
  ] as const)("creates %s directly with the internal Professional template", async (name, kind) => {
    const user = userEvent.setup();
    render(<CreateDocumentPage locale="en" />);
    await user.click(screen.getByRole("radio", { name: new RegExp(name.split(" ")[0]!, "i") }));
    await user.click(screen.getByRole("button", { name: "Create and Open Editor" }));

    expect(createDocument).toHaveBeenCalledWith(kind, "en", "signature");
    expect(push).toHaveBeenCalledWith("/en/app/documents/33333333-3333-4333-8333-333333333333");
  });
});

describe("document language", () => {
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it("creates an Arabic document from the English UI and stays on the UI locale route", async () => {
    const user = userEvent.setup();
    render(<CreateDocumentPage locale="en" />);
    await user.click(screen.getByRole("radio", { name: "العربية" }));
    await user.click(screen.getByRole("button", { name: "Create and Open Editor" }));

    expect(createDocument).toHaveBeenCalledWith("cv", "ar", "signature");
    expect(push).toHaveBeenCalledWith("/en/app/documents/33333333-3333-4333-8333-333333333333");
  });
});
