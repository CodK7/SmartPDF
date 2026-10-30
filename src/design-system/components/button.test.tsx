import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./button";

describe("Button", () => {
  it("is keyboard operable and calls its action once", async () => {
    const action = vi.fn();
    render(<Button onClick={action}>Export PDF</Button>);

    await userEvent.setup().tab();
    await userEvent.keyboard("{Enter}");

    expect(screen.getByRole("button", { name: "Export PDF" })).toHaveFocus();
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("does not run when disabled", async () => {
    const action = vi.fn();
    render(
      <Button disabled onClick={action}>
        Saving
      </Button>,
    );

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Saving" }));
    expect(action).not.toHaveBeenCalled();
  });
});
