import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LandingPage } from "./landing-page";

describe("English landing page", () => {
  it("keeps one workspace link, offers the Arabic switch, and has no quotation copy", () => {
    render(<LandingPage />);

    expect(screen.getByText("SmartPDF")).toBeInTheDocument();
    expect(screen.queryByText("SmartPDF AI")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Open workspace" })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Open workspace" })).toHaveClass("display-type");
    expect(screen.getByRole("link", { name: "العربية" })).toHaveAttribute("href", "/ar");
    expect(screen.getByRole("img", { name: "Portrait of Daniel Brooks" })).toHaveClass("rounded-full");
    expect(screen.getByText("Daniel Brooks")).toBeInTheDocument();
    expect(screen.getByText(/\+1 \(312\) 555-0147/)).toBeInTheDocument();
    expect(screen.getByText(/daniel44@gmail\.com/)).toBeInTheDocument();
    expect(screen.queryByText(/daniel\.brooks@example\.com/)).not.toBeInTheDocument();
    expect(screen.getByText(/Privacy first/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacy details" })).toHaveAttribute("href", "/en/privacy");
    expect(screen.queryByText(/quotation/i)).not.toBeInTheDocument();
    expect(screen.getByText("A4")).toBeInTheDocument();
    expect(screen.queryByText(/100%/)).not.toBeInTheDocument();
  });
});
