import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { WorkspaceShell } from "./workspace-shell";

describe("workspace navigation", () => {
  it("keeps Documents as the only destination and removes Local Space", () => {
    render(<WorkspaceShell locale="en"><main>Content</main></WorkspaceShell>);
    const navigations = screen.getAllByRole("navigation", { name: "Workspace" });
    for (const navigation of navigations) {
      expect(within(navigation).getByRole("link", { name: "Documents" })).toBeInTheDocument();
      expect(within(navigation).queryByRole("link", { name: "Templates" })).not.toBeInTheDocument();
      expect(within(navigation).queryByRole("link", { name: "New document" })).not.toBeInTheDocument();
    }
    expect(screen.queryByText("Local workspace")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "New document" })).not.toBeInTheDocument();
  });

  it("collapses to only a small expand control and restores the desktop sidebar", async () => {
    const user = userEvent.setup();
    render(<WorkspaceShell locale="en"><main>Content</main></WorkspaceShell>);

    const collapseButton = screen.getByRole("button", { name: "Collapse sidebar" });
    expect(within(collapseButton.parentElement!).getByRole("link", { name: "SmartPDF" })).toBeInTheDocument();
    const documentsLink = screen.getAllByRole("link", { name: "Documents" })[0]!;
    expect(collapseButton.compareDocumentPosition(documentsLink) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await user.click(collapseButton);
    const expandButton = screen.getByRole("button", { name: "Expand sidebar" });
    expect(expandButton).toHaveAttribute("aria-expanded", "false");
    const sidebar = expandButton.closest("aside");
    expect(sidebar).not.toBeNull();
    expect(within(sidebar!).queryByRole("link", { name: "SmartPDF" })).not.toBeInTheDocument();
    expect(within(sidebar!).queryByRole("link", { name: "Documents" })).not.toBeInTheDocument();

    await user.click(expandButton);
    expect(screen.getByRole("button", { name: "Collapse sidebar" })).toHaveAttribute("aria-expanded", "true");
  });
});
