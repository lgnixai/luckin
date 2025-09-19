import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface FileNodeData {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId?: string;
  children?: string[];
  documentId?: string;
  createdAt: number;
  updatedAt: number;
}

interface FileTreeState {
  nodesById: Record<string, FileNodeData>;
  rootId: string;
  createFolder: (parentId: string, name?: string) => string;
  createFile: (parentId: string, name?: string, documentId?: string) => string;
  renameNode: (id: string, name: string) => void;
  deleteNode: (id: string) => void;
  listChildren: (id: string) => FileNodeData[];
  setDocumentId: (fileId: string, documentId: string) => void;
}

const STORAGE_KEY = 'obsidian.clone.filetree';

const loadInitial = (): { rootId: string; nodesById: Record<string, FileNodeData> } => {
  if (typeof window === 'undefined') {
    const id = 'root-' + Date.now().toString(36);
    const now = Date.now();
    const root: FileNodeData = { id, name: 'Vault', type: 'folder', children: [], createdAt: now, updatedAt: now };
    return { rootId: id, nodesById: { [id]: root } };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as any;
  } catch {}
  const id = 'root-' + Date.now().toString(36);
  const now = Date.now();
  const root: FileNodeData = { id, name: 'Vault', type: 'folder', children: [], createdAt: now, updatedAt: now };
  return { rootId: id, nodesById: { [id]: root } };
};

export const useFileTree = create<FileTreeState>()(
  immer((set: (fn: (state: FileTreeState) => void) => void, get: () => FileTreeState) => ({
    ...loadInitial(),

    createFolder: (parentId: string, name?: string) => {
      const id = 'fld-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const now = Date.now();
      set((state: FileTreeState) => {
        const parent = state.nodesById[parentId];
        if (!parent || parent.type !== 'folder') return;
        const node: FileNodeData = { id, name: name ?? '新建文件夹', type: 'folder', parentId, children: [], createdAt: now, updatedAt: now };
        state.nodesById[id] = node;
        const children = parent.children || (parent.children = []);
        children.push(id);
        parent.updatedAt = now;
      });
      return id;
    },

    createFile: (parentId: string, name?: string, documentId?: string) => {
      const id = 'fil-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const now = Date.now();
      set((state: FileTreeState) => {
        const parent = state.nodesById[parentId];
        if (!parent || parent.type !== 'folder') return;
        const node: FileNodeData = { id, name: name ?? '未命名.md', type: 'file', parentId, documentId, createdAt: now, updatedAt: now };
        state.nodesById[id] = node;
        const children = parent.children || (parent.children = []);
        children.push(id);
        parent.updatedAt = now;
      });
      return id;
    },

    renameNode: (id: string, name: string) => {
      set((state: FileTreeState) => {
        const node = state.nodesById[id];
        if (!node) return;
        node.name = name;
        node.updatedAt = Date.now();
      });
    },

    deleteNode: (id: string) => {
      set((state: FileTreeState) => {
        const removeRecursively = (nid: string) => {
          const n = state.nodesById[nid];
          if (!n) return;
          if (n.type === 'folder' && n.children) n.children.forEach(removeRecursively);
          delete state.nodesById[nid];
        };
        const node = state.nodesById[id];
        if (!node) return;
        const parentId = node.parentId;
        removeRecursively(id);
        if (parentId && state.nodesById[parentId]) {
          const parent = state.nodesById[parentId];
          parent.children = (parent.children || []).filter((cid) => cid !== id);
          parent.updatedAt = Date.now();
        }
      });
    },

    listChildren: (id: string) => {
      const node = get().nodesById[id];
      if (!node || node.type !== 'folder') return [];
      return (node.children || []).map((cid) => get().nodesById[cid]).filter(Boolean) as FileNodeData[];
    },

    setDocumentId: (fileId: string, documentId: string) => {
      set((state: FileTreeState) => {
        const node = state.nodesById[fileId];
        if (node && node.type === 'file') {
          node.documentId = documentId;
          node.updatedAt = Date.now();
        }
      });
    }
  }))
);

// Enhanced persistence with real-time saving
if (typeof window !== 'undefined') {
  let timer: number | null = null;
  let lastSavedState: string | null = null;
  
  useFileTree.subscribe((state: FileTreeState) => {
    if (timer) window.clearTimeout(timer);
    
    // 更频繁的保存以实现实时效果
    timer = window.setTimeout(() => {
      try {
        const currentState = JSON.stringify({ rootId: state.rootId, nodesById: state.nodesById });
        
        // 只在状态真正改变时保存
        if (currentState !== lastSavedState) {
          localStorage.setItem(STORAGE_KEY, currentState);
          lastSavedState = currentState;
          
          // 备份保存
          localStorage.setItem(`${STORAGE_KEY}_backup`, JSON.stringify({
            timestamp: Date.now(),
            data: { rootId: state.rootId, nodesById: state.nodesById }
          }));
          
          console.log('File tree auto-saved to localStorage');
        }
      } catch (error) {
        console.error('Failed to save file tree:', error);
      }
    }, 200); // 减少延迟到200ms以实现更实时的保存
  });
}

