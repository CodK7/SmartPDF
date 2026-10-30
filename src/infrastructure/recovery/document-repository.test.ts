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

  it.each([["OMR", 123_450], ["AED", 12_345], ["SAR", 12_345]])("reads an old v1 %s invoice without changing the amounts shown", async (currency, expectedMinor) => {
    const records = installFakeIndexedDb();
    const invoice = createDocument("invoice", "en");
    invoice.content.currency = currency;
    invoice.content.lineItems[0]!.unitPriceMinor = 12_345;
    invoice.content.discountMinor = 500;
    records.set(invoice.id, structuredClone({ ...invoice, schemaVersion: 1 }));

    const stored = await getDocument(invoice.id);

    expect(stored?.schemaVersion).toBe(2);
    expect(stored?.kind === "invoice" && stored.content.lineItems[0]!.unitPriceMinor).toBe(expectedMinor);
    expect(stored?.kind === "invoice" && stored.content.discountMinor).toBe(currency === "OMR" ? 5_000 : 500);
  });

  it("does not rescale a document that is already v2", async () => {
    const records = installFakeIndexedDb();
    const invoice = createDocument("invoice", "en");
    invoice.content.currency = "OMR";
    invoice.content.lineItems[0]!.unitPriceMinor = 12_345;
    records.set(invoice.id, structuredClone(invoice));

    const stored = await getDocument(invoice.id);

    expect(stored?.kind === "invoice" && stored.content.lineItems[0]!.unitPriceMinor).toBe(12_345);
  });
});
