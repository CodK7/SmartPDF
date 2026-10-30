import type { SmartDocument } from "@/domain/documents/types";
import { saveDocument } from "@/infrastructure/recovery/document-repository";

interface SaveJob {
  latest: SmartDocument;
  report: (state: SaveState) => void;
  timer?: ReturnType<typeof setTimeout>;
  saving: boolean;
  cancelled: boolean;
}

const pendingSaves = new Map<string, SaveJob>();

export type SaveState = "idle" | "saving" | "saved" | "error";

export function scheduleAutosave(document: SmartDocument, report: (state: SaveState) => void): void {
  const existing = pendingSaves.get(document.id);
  if (existing?.timer) clearTimeout(existing.timer);
  const job: SaveJob = existing ?? { latest: document, report, saving: false, cancelled: false };
  job.latest = document;
  job.report = report;
  job.cancelled = false;
  report("saving");
  job.timer = setTimeout(() => { void flushSave(document.id); }, 800);
  pendingSaves.set(document.id, job);
}

async function flushSave(documentId: string): Promise<void> {
  const job = pendingSaves.get(documentId);
  if (!job || job.cancelled || job.saving) return;
  job.timer = undefined;
  job.saving = true;
  const snapshot = job.latest;
  try {
    await saveDocument(snapshot);
    if (job.cancelled) return;
    if (job.latest.revision > snapshot.revision) {
      job.saving = false;
      job.timer = setTimeout(() => { void flushSave(documentId); }, 0);
      return;
    }
    job.report("saved");
    pendingSaves.delete(documentId);
  } catch {
    if (!job.cancelled) job.report("error");
    pendingSaves.delete(documentId);
  } finally {
    job.saving = false;
  }
}

export function cancelAutosave(documentId: string): void {
  const pending = pendingSaves.get(documentId);
  if (pending?.timer) clearTimeout(pending.timer);
  if (pending) pending.cancelled = true;
  pendingSaves.delete(documentId);
}
