import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { toast, ToastViewport } from "./toast";

describe("toast notifications", () => {
  it("announces and dismisses a success notification", () => {
    render(<ToastViewport direction="ltr" />);
    act(() => toast.success("PDF downloaded"));

    expect(screen.getByRole("status")).toHaveTextContent("PDF downloaded");
    fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("announces errors assertively", () => {
    render(<ToastViewport direction="rtl" />);
    act(() => toast.error("تعذر التصدير"));

    expect(screen.getByRole("alert")).toHaveTextContent("تعذر التصدير");
    expect(screen.getByRole("button", { name: "إغلاق الإشعار" })).toBeInTheDocument();
  });
});
