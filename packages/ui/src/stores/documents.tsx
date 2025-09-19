import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface DocumentData {
  id: string;
  name: string;
  content: string;
  language: string;
  path?: string;
  createdAt: number;
  updatedAt: number;
  isDirty: boolean;
}

interface DocumentsState {
  documentsById: Record<string, DocumentData>;
  createDocument: (name: string, options?: { content?: string; language?: string; path?: string }) => string;
  updateDocumentContent: (id: string, content: string) => void;
  renameDocument: (id: string, name: string) => void;
  setDocumentLanguage: (id: string, language: string) => void;
  setDocumentPath: (id: string, path: string) => void;
  markDocumentClean: (id: string) => void;
  saveDocument: (id: string) => void;
  getDocument: (id?: string) => DocumentData | undefined;
  getAllDirtyDocuments: () => DocumentData[];
}

const STORAGE_KEY = 'obsidian.clone.documents';

const loadInitialDocuments = (): Record<string, DocumentData> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, DocumentData>) : {};
  } catch {
    return {};
  }
};

export const useDocuments = create<DocumentsState>()(
  immer((set: (fn: (state: DocumentsState) => void) => void, get: () => DocumentsState) => ({
    documentsById: loadInitialDocuments(),

    createDocument: (name: string, options?: { content?: string; language?: string; path?: string }) => {
      const id = Date.now().toString() + Math.random().toString(36).slice(2);
      const now = Date.now();
      const doc: DocumentData = {
        id,
        name,
        content: options?.content ?? '',
        language: options?.language ?? 'markdown',
        path: options?.path,
        createdAt: now,
        updatedAt: now,
        isDirty: Boolean(options?.content && options?.content.length > 0)
      };
      set((state) => {
        state.documentsById[id] = doc;
      });
      return id;
    },

    updateDocumentContent: (id: string, content: string) => {
      set((state: DocumentsState) => {
        const existing = state.documentsById[id];
        if (!existing) return;
        existing.content = content;
        existing.updatedAt = Date.now();
        existing.isDirty = true;
      });
    },

    renameDocument: (id: string, name: string) => {
      set((state: DocumentsState) => {
        const existing = state.documentsById[id];
        if (!existing) return;
        existing.name = name;
        existing.updatedAt = Date.now();
      });
    },

    setDocumentLanguage: (id: string, language: string) => {
      set((state: DocumentsState) => {
        const existing = state.documentsById[id];
        if (!existing) return;
        existing.language = language;
        existing.updatedAt = Date.now();
      });
    },

    setDocumentPath: (id: string, path: string) => {
      set((state: DocumentsState) => {
        const existing = state.documentsById[id];
        if (!existing) return;
        existing.path = path;
        existing.updatedAt = Date.now();
      });
    },

    markDocumentClean: (id: string) => {
      set((state: DocumentsState) => {
        const existing = state.documentsById[id];
        if (!existing) return;
        existing.isDirty = false;
        existing.updatedAt = Date.now();
      });
    },

    saveDocument: (id: string) => {
      set((state: DocumentsState) => {
        const existing = state.documentsById[id];
        if (!existing) return;
        existing.isDirty = false;
        existing.updatedAt = Date.now();
      });
    },

    getDocument: (id?: string) => {
      if (!id) return undefined;
      return get().documentsById[id];
    },

    getAllDirtyDocuments: () => {
      const state = get();
      return Object.values(state.documentsById).filter(doc => doc.isDirty);
    }
  }))
);

// Enhanced persistence: debounce save with auto-save features
if (typeof window !== 'undefined') {
  let timer: number | null = null;
  let lastSavedState: string | null = null;
  
  useDocuments.subscribe((state: DocumentsState) => {
    if (timer) window.clearTimeout(timer);
    
    // 实时保存（更短的延迟）
    timer = window.setTimeout(() => {
      try {
        const currentState = JSON.stringify(state.documentsById);
        
        // 只在状态真正改变时保存
        if (currentState !== lastSavedState) {
          localStorage.setItem(STORAGE_KEY, currentState);
          lastSavedState = currentState;
          
          // 同时保存到自动保存存储中
          localStorage.setItem(`${STORAGE_KEY}_autosave`, JSON.stringify({
            timestamp: Date.now(),
            documents: state.documentsById
          }));
          
          console.log('Documents auto-saved to localStorage');
        }
      } catch (error) {
        console.error('Failed to save documents:', error);
      }
    }, 300); // 减少延迟到300ms以实现更实时的保存
  });
}

