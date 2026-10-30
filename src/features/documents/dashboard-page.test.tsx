import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({
  documents: [] as Array<Record<string, unknown>>,
  loading: false,
  error: null,
  hydrate: vi.fn(async () => undefined),
  removeDocument: vi.fn(async () => undefined),
}));

vi.mock("./workspace-store", () => ({ useWorkspaceStore: () => store }));

import { DashboardPage } from "./dashboard-page";

describe("documents dashboard", () => {
  beforeEach(() => { store.documents = []; });

  it("shows one primary New Document action and a button-free empty state", () => {
    render(<DashboardPage locale="en" />);

    expect(screen.getAllByRole("link", { name: "New document" })).toHaveLength(1);
    expect(screen.getByText("No documents yet.")).toBeInTheDocument();
    expect(screen.queryByText("Create your first document using the New Document button above.")).not.toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(screen.queryByText(/saved privately/i)).not.toBeInTheDocument();
  });

  it("shows the matching Arabic empty state without search or storage messaging", () => {
    render(<DashboardPage locale="ar" />);
    expect(screen.getByText("لا توجد مستندات بعد.")).toBeInTheDocument();
    expect(screen.queryByText(/زر «مستند جديد» في الأعلى/)).not.toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(screen.queryByText(/تُحفظ المستندات/)).not.toBeInTheDocument();
  });
});
