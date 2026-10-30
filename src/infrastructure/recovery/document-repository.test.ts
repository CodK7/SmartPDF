import { afterEach, describe, expect, it, vi } from "vitest";
import { createDocument } from "@/domain/documents/defaults";
import { smartDocumentSchema } from "@/domain/documents/schema";
import { preflight } from "@/domain/documents/preflight";
import { getDocument, saveDocument } from "./document-repository";

function installFakeIndexedDb() {
  const records = new Map<string, { id: string }>();
  const request = (run: () => unknown) => {
    const req: { result?: unknown; onsuccess?: () => void } = {};
    queueMicrotask(() => { req.result = run(); req.onsuccess?.(); });
    return req;
  };
  const store = {
    createIndex: () => undefined,
    put: (value: { id: string }) => request(() => { records.set(value.id, structuredClone(value)); return value.id; }),
    get: (id: string) => request(() => records.get(id)),
  };
  const database = { objectStoreNames: { contains: () => true }, createObjectStore: () => store, transaction: () => ({ objectStore: () => store }), close: () => undefined };
  vi.stubGlobal("indexedDB", { open: () => {
    const req: { result: unknown; onsuccess?: () => void } = { result: database };
    setTimeout(() => req.onsuccess?.(), 0);
    return req;
  } });
  return records;
}

describe("draft persistence", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("saves the other edits while one field is temporarily invalid, and blocks only export", async () => {
    const records = installFakeIndexedDb();
    const document = createDocument("cv", "en");
    document.content.email = "not-an-email";
    document.content.summary = "A new summary written while the email is half typed";
    document.title = "Edited title";

    await expect(saveDocument(document)).resolves.toBeUndefined();

    const stored = await getDocument(document.id);
    expect(records.size).toBe(1);
    expect(stored?.title).toBe("Edited title");
    expect(stored?.kind === "cv" && stored.content.summary).toBe("A new summary written while the email is half typed");
    expect(stored?.kind === "cv" && stored.content.email).toBe("not-an-email");
    expect(smartDocumentSchema.safeParse(stored).success).toBe(false);
    expect(preflight(stored!).map(({ code }) => code)).toContain("CV_EMAIL_INVALID");
  });
});
