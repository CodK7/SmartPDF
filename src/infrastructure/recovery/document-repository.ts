import { draftDocumentSchema } from "@/domain/documents/schema";
import type { SmartDocument } from "@/domain/documents/types";

const DATABASE_NAME = "smartpdf-local";
const STORE_NAME = "documents";
const DATABASE_VERSION = 1;
const pendingWrites = new Map<string, Promise<void>>();
const deletedDocumentIds = new Set<string>();

async function serializeWrite(documentId: string, operation: () => Promise<void>): Promise<void> {
  const previous = pendingWrites.get(documentId) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(operation);
  pendingWrites.set(documentId, current);
  try { await current; }
  finally { if (pendingWrites.get(documentId) === current) pendingWrites.delete(documentId); }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("LOCAL_DATABASE_UNAVAILABLE"));
    request.onblocked = () => reject(new Error("LOCAL_DATABASE_BLOCKED"));
  });
}

async function runRequest<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, mode);
      const request = operation(transaction.objectStore(STORE_NAME));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error("LOCAL_DATABASE_OPERATION_FAILED"));
      transaction.onabort = () => reject(new Error("LOCAL_DATABASE_TRANSACTION_ABORTED"));
    });
  } finally {
    database.close();
  }
}

export async function listDocuments(): Promise<SmartDocument[]> {
  const records = await runRequest<unknown[]>("readonly", (store) => store.getAll());
  return records
    .flatMap((record) => {
      const parsed = draftDocumentSchema.safeParse(record);
      return parsed.success ? [parsed.data] : [];
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getDocument(id: string): Promise<SmartDocument | null> {
  const record = await runRequest<unknown>("readonly", (store) => store.get(id));
  if (record === undefined) return null;
  const parsed = draftDocumentSchema.safeParse(record);
  return parsed.success && parsed.data.ownerId === "local" ? parsed.data : null;
}

export async function saveDocument(document: SmartDocument): Promise<void> {
  const validated = draftDocumentSchema.parse(document);
  await serializeWrite(validated.id, async () => {
    if (deletedDocumentIds.has(validated.id)) throw new Error("DOCUMENT_DELETED");
    await runRequest<IDBValidKey>("readwrite", (store) => store.put(validated));
  });
}

export async function deleteDocument(id: string): Promise<void> {
  deletedDocumentIds.add(id);
  await serializeWrite(id, async () => {
    await runRequest<undefined>("readwrite", (store) => store.delete(id));
  });
}
