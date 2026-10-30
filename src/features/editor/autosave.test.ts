import { afterEach, describe, expect, it, vi } from "vitest";
import { createDocument } from "@/domain/documents/defaults";

const saveDocument = vi.hoisted(() => vi.fn());
vi.mock("@/infrastructure/recovery/document-repository", () => ({ saveDocument }));

import { cancelAutosave, scheduleAutosave } from "./autosave";

describe("autosave ordering", () => {
  afterEach(() => {
    cancelAutosave("44444444-4444-4444-8444-444444444444");
    saveDocument.mockReset();
    vi.useRealTimers();
  });

  it("serializes overlapping saves and persists the newest revision last", async () => {
    vi.useFakeTimers();
    const first = createDocument("cv", "en");
    first.id = "44444444-4444-4444-8444-444444444444";
    first.revision = 1;
    first.content.fullName = "Older name";
    const latest = structuredClone(first);
    latest.revision = 2;
    latest.content.fullName = "Newest name";

    let finishFirst!: () => void;
    saveDocument
      .mockImplementationOnce(() => new Promise<void>((resolve) => { finishFirst = resolve; }))
      .mockResolvedValueOnce(undefined);
    const states: string[] = [];

    scheduleAutosave(first, (state) => states.push(state));
    await vi.advanceTimersByTimeAsync(800);
    expect(saveDocument).toHaveBeenCalledTimes(1);

    scheduleAutosave(latest, (state) => states.push(state));
    await vi.advanceTimersByTimeAsync(800);
    expect(saveDocument).toHaveBeenCalledTimes(1);

    finishFirst();
    await Promise.resolve();
    await vi.runAllTimersAsync();

    expect(saveDocument).toHaveBeenCalledTimes(2);
    expect(saveDocument.mock.calls[1]?.[0]).toMatchObject({ revision: 2, content: { fullName: "Newest name" } });
    expect(states.at(-1)).toBe("saved");
  });

  it("does not run a pending save after deletion cancellation", async () => {
    vi.useFakeTimers();
    const document = createDocument("cv", "en");
    document.id = "44444444-4444-4444-8444-444444444444";

    scheduleAutosave(document, vi.fn());
    cancelAutosave(document.id);
    await vi.runAllTimersAsync();

    expect(saveDocument).not.toHaveBeenCalled();
  });
});
