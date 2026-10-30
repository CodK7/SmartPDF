import { afterEach, describe, expect, it, vi } from "vitest";
import { createDocument } from "@/domain/documents/defaults";

const { cancelAutosave, deleteDocument } = vi.hoisted(() => ({
  cancelAutosave: vi.fn(),
  deleteDocument: vi.fn(async () => undefined),
}));

vi.mock("@/features/editor/autosave", () => ({
  cancelAutosave,
  scheduleAutosave: vi.fn(),
}));
vi.mock("@/infrastructure/recovery/document-repository", () => ({
  deleteDocument,
  getDocument: vi.fn(),
  listDocuments: vi.fn(),
  saveDocument: vi.fn(),
}));

import { useWorkspaceStore } from "./workspace-store";

describe("workspace deletion", () => {
  afterEach(() => {
    cancelAutosave.mockClear();
    deleteDocument.mockClear();
    useWorkspaceStore.setState({ documents: [], activeDocument: null });
  });

  it("cancels autosave before deleting the local document", async () => {
    const document = createDocument("cv", "en");
    useWorkspaceStore.setState({ documents: [document], activeDocument: document });

    await useWorkspaceStore.getState().removeDocument(document.id);

    expect(cancelAutosave).toHaveBeenCalledWith(document.id);
    expect(deleteDocument).toHaveBeenCalledWith(document.id);
    expect(cancelAutosave.mock.invocationCallOrder[0]).toBeLessThan(deleteDocument.mock.invocationCallOrder[0]!);
    expect(useWorkspaceStore.getState()).toMatchObject({ documents: [], activeDocument: null });
  });
});
