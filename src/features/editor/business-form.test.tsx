import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { createDocument } from "@/domain/documents/defaults";
import type { InvoiceDocument } from "@/domain/documents/types";
import { BusinessForm } from "./business-form";

function InvoiceHarness({ onUpdate }: { onUpdate?: (document: InvoiceDocument) => void }) {
  const [document, setDocument] = useState(() => createDocument("invoice", "en"));
  return <BusinessForm document={document} locale="en" update={(next) => {
    if (next.kind !== "invoice") throw new Error("Expected invoice");
    setDocument(next);
    onUpdate?.(next);
  }} />;
}

describe("invoice form controls", () => {
  it("selects issue and due dates without resetting month or year", async () => {
    const user = userEvent.setup();
    let latest: InvoiceDocument | undefined;
    render(<InvoiceHarness onUpdate={(document) => { latest = document; }} />);
    await user.click(screen.getByRole("button", { name: "Issue date" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Month" }), "8");
    await user.selectOptions(screen.getByRole("combobox", { name: "Year" }), "2026");
    expect(screen.getByRole("combobox", { name: "Month" })).toHaveValue("8");
    expect(screen.getByRole("combobox", { name: "Year" })).toHaveValue("2026");
    await user.click(screen.getByRole("gridcell", { name: /September 10, 2026/ }));

    await user.click(screen.getByRole("button", { name: "Due date" }));
    expect(screen.getByRole("combobox", { name: "Month" })).toHaveValue("8");
    expect(screen.getByRole("combobox", { name: "Year" })).toHaveValue("2026");
    expect(screen.getByRole("gridcell", { name: /September 9, 2026/ })).toBeDisabled();
    await user.click(screen.getByRole("gridcell", { name: /September 30, 2026/ }));

    expect(latest?.content).toMatchObject({ issueDate: "2026-09-10", dueDate: "2026-09-30" });

    await user.click(screen.getByRole("button", { name: "Issue date" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Month" }), "9");
    expect(screen.getByRole("combobox", { name: "Year" })).toHaveValue("2026");
    await user.selectOptions(screen.getByRole("combobox", { name: "Year" }), "2027");
    expect(screen.getByRole("combobox", { name: "Month" })).toHaveValue("9");
  });

  it("accepts quantity, price, tax, and discount by keyboard and normalizes bounds on blur", async () => {
    const user = userEvent.setup();
    let latest: InvoiceDocument | undefined;
    render(<InvoiceHarness onUpdate={(document) => { latest = document; }} />);

    const quantity = screen.getByLabelText("Quantity");
    await user.clear(quantity);
    await user.type(quantity, "2.5");
    expect(latest?.content.lineItems[0]?.quantity).toBe(2.5);

    const price = screen.getByLabelText("Unit price");
    await user.clear(price);
    await user.type(price, "125.75");
    expect(latest?.content.lineItems[0]?.unitPriceMinor).toBe(12_575);

    const tax = screen.getByLabelText("Tax %");
    await user.clear(tax);
    await user.type(tax, "150");
    await user.tab();
    expect(tax).toHaveValue(100);
    expect(latest?.content.taxRate).toBe(100);

    const discount = screen.getByLabelText("Discount");
    await user.clear(discount);
    await user.type(discount, "10.5");
    expect(latest?.content.discountMinor).toBe(1_050);
    expect(quantity).toHaveAttribute("inputmode", "decimal");
  });
});
