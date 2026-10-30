import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({
  activeDocument: {
    id: "44444444-4444-4444-8444-444444444444", ownerId: "local", schemaVersion: 1,
    title: "Invoice", status: "draft", templateId: "signature", locale: "en", direction: "ltr",
    paper: "A4", revision: 0, createdAt: "2026-08-30T00:00:00.000Z", updatedAt: "2026-08-30T00:00:00.000Z",
    kind: "invoice",
    content: {
      issuer: { name: "", email: "", phone: "", address: "", taxId: "" },
      client: { name: "", email: "", phone: "", address: "", taxId: "" },
      number: "", issueDate: "2026-08-30", dueDate: "", currency: "USD",
      lineItems: [{ id: "55555555-5555-4555-8555-555555555555", description: "", quantity: 1, unitPriceMinor: 0 }],
      taxRate: 0, discountMinor: 0, notes: "",
    },
  },
  loading: false,
  error: null,
  saveState: "saved",
  openDocument: vi.fn(async () => null),
  updateActive: vi.fn(),
}));

vi.mock("@/features/documents/workspace-store", () => ({ useWorkspaceStore: () => store }));
vi.mock("./business-form", () => ({ BusinessForm: () => <div>Business form</div> }));
vi.mock("./cv-form", () => ({ CvForm: () => <div>CV form</div> }));
vi.mock("@/features/preview/document-preview", () => ({ DocumentPreview: () => <div>Document preview</div> }));

import { DocumentEditor } from "./document-editor";

describe("document editor layout", () => {
  it("removes template switching, exposes an accessible mobile view switcher, and keeps scrolling inside stable panes", () => {
    const { container } = render(<DocumentEditor id={store.activeDocument.id} locale="en" />);

    expect(screen.queryByRole("combobox", { name: "Template" })).not.toBeInTheDocument();
    const formPane = screen.getByText("Business form").parentElement;
    expect(formPane).toHaveClass("overflow-y-auto", "overscroll-contain");
    expect(formPane?.parentElement).toHaveClass("min-[1152px]:h-[calc(100dvh-64px)]", "min-[1152px]:overflow-hidden");
    expect(screen.getByRole("tablist", { name: "Editor view" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Edit" })).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByRole("tab", { name: "Preview" }));
    expect(screen.getByRole("tab", { name: "Preview" })).toHaveAttribute("aria-selected", "true");
    expect(container.querySelectorAll(".fixed")).toHaveLength(0);

    if (!formPane) throw new Error("Missing form pane");
    formPane.scrollTop = 600;
    fireEvent.scroll(formPane);
    formPane.scrollTop = 0;
    fireEvent.scroll(formPane);
    expect(formPane.scrollTop).toBe(0);
  });
});

describe("save status indicator", () => {
  it("shows saving, saved and failed states", () => {
    const { rerender } = render(<DocumentEditor id={store.activeDocument.id} locale="en" />);
    const status = () => screen.getByRole("status", { name: "" }).textContent;
    expect(status()).toBe("Saved");
    for (const [state, label] of [["saving", "Saving…"], ["error", "Save failed"]] as const) {
      store.saveState = state;
      rerender(<DocumentEditor id={store.activeDocument.id} locale="en" />);
      expect(status()).toBe(label);
    }
    store.saveState = "saved";
  });
});
