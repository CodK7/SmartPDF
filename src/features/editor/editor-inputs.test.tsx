import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { MonthYearField } from "./month-year-field";
import { SkillsInput } from "./skills-input";

describe("CV editor inputs", () => {
  it("changes month and year independently without resetting the other value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MonthYearField id="start" label="تاريخ البدء" locale="ar" value="" onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText("الشهر"), "03");
    await user.selectOptions(screen.getByLabelText("السنة"), "2024");
    expect(onChange).toHaveBeenLastCalledWith("2024-03");

    await user.selectOptions(screen.getByLabelText("الشهر"), "11");
    expect(screen.getByLabelText("السنة")).toHaveValue("2024");
    expect(onChange).toHaveBeenLastCalledWith("2024-11");

    await user.selectOptions(screen.getByLabelText("السنة"), "2022");
    expect(screen.getByLabelText("الشهر")).toHaveValue("11");
    expect(onChange).toHaveBeenLastCalledWith("2022-11");
  });

  it("keeps spaces inside skills and commits with Enter or comma", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [skills, setSkills] = useState<string[]>([]);
      return <SkillsInput id="skills" locale="ar" value={skills} onChange={setSkills} />;
    }
    render(<Harness />);
    const input = screen.getByLabelText("المهارات");

    await user.type(input, "العمل تحت الضغط{Enter}");
    await user.type(input, "حل المشكلات,");

    expect(screen.getByText("العمل تحت الضغط")).toBeInTheDocument();
    expect(screen.getByText("حل المشكلات")).toBeInTheDocument();
    expect(input).toHaveValue("");
  });
});
