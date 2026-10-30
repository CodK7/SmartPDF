"use client";

import { create } from "zustand";
import { documentEngine } from "@/document-engine/registry";
import type { DocumentKind, Locale, SmartDocument } from "@/domain/documents/types";
import { cancelAutosave, scheduleAutosave, type SaveState } from "@/features/editor/autosave";
import { deleteDocument, getDocument, listDocuments, saveDocument } from "@/infrastructure/recovery/document-repository";

interface WorkspaceState {
  documents: SmartDocument[];
  activeDocument: SmartDocument | null;
  loading: boolean;
  error: string | null;
  saveState: SaveState;
  hydrate: () => Promise<void>;
  createDocument: (kind: DocumentKind, locale: Locale, templateId?: string) => Promise<SmartDocument>;
  openDocument: (id: string) => Promise<SmartDocument | null>;
  updateActive: (updater: (document: SmartDocument) => SmartDocument) => void;
  removeDocument: (id: string) => Promise<void>;
}

function replaceDocument(documents: SmartDocument[], next: SmartDocument) {
  const exists = documents.some(({ id }) => id === next.id);
  const merged = exists ? documents.map((document) => document.id === next.id ? next : document) : [next, ...documents];
  return merged.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  documents: [], activeDocument: null, loading: false, error: null, saveState: "idle",
  hydrate: async () => {
    set({ loading: true, error: null });
    try { set({ documents: await listDocuments(), loading: false }); }
    catch { set({ loading: false, error: "LOCAL_STORAGE_UNAVAILABLE" }); }
  },
  createDocument: async (kind, locale, templateId = "signature") => {
    const document = { ...documentEngine.create(kind, locale), templateId } as SmartDocument;
    await saveDocument(document);
    set((state) => ({ documents: replaceDocument(state.documents, document), activeDocument: document, saveState: "saved" }));
    return document;
  },
  openDocument: async (id) => {
    set({ loading: true, error: null });
    const document = await getDocument(id);
    set({ activeDocument: document, loading: false, saveState: "idle", error: document ? null : "DOCUMENT_NOT_FOUND" });
    return document;
  },
  updateActive: (updater) => {
    const active = get().activeDocument;
    if (!active) return;
    const next = { ...updater(active), revision: active.revision + 1, updatedAt: new Date().toISOString() } as SmartDocument;
    set((state) => ({ activeDocument: next, documents: replaceDocument(state.documents, next) }));
    scheduleAutosave(next, (saveState) => set({ saveState }));
  },
  removeDocument: async (id) => {
    cancelAutosave(id);
    await deleteDocument(id);
    set((state) => ({ documents: state.documents.filter((document) => document.id !== id), activeDocument: state.activeDocument?.id === id ? null : state.activeDocument }));
  },
}));
