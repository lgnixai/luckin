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
  // 当前在侧边栏选中的节点（用于高亮、重命名等）
  selectedId?: string | null;
  // 新建文件/文件夹时的目标文件夹；默认等于 rootId
  currentFolderId?: string;
  createFolder: (parentId: string, name?: string) => string;
  createFile: (parentId: string, name?: string, documentId?: string) => string;
  renameNode: (id: string, name: string) => void;
  deleteNode: (id: string) => void;
  listChildren: (id: string) => FileNodeData[];
  moveNode: (id: string, newParentId: string) => void;
  setSelectedId: (id: string | null) => void;
  setCurrentFolderId: (id: string) => void;
  getPath: (id: string) => string;
  findNodeByDocumentId: (docId: string) => FileNodeData | undefined;
  linkDocument: (id: string, documentId: string) => void;
}

const STORAGE_KEY = 'obsidian.clone.filetree';

const loadInitial = (): { rootId: string; nodesById: Record<string, FileNodeData>; selectedId?: string | null; currentFolderId?: string } => {
  if (typeof window === 'undefined') {
    const id = 'root-' + Date.now().toString(36);
    const now = Date.now();
    const root: FileNodeData = { id, name: 'Vault', type: 'folder', children: [], createdAt: now, updatedAt: now };
    return { rootId: id, nodesById: { [id]: root }, selectedId: id, currentFolderId: id };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as any;
  } catch {}
  const id = 'root-' + Date.now().toString(36);
  const now = Date.now();
  const root: FileNodeData = { id, name: 'Vault', type: 'folder', children: [], createdAt: now, updatedAt: now };
  return { rootId: id, nodesById: { [id]: root }, selectedId: id, currentFolderId: id };
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
        state.selectedId = id;
        state.currentFolderId = id;
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
        state.selectedId = id;
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
        if (state.selectedId === id) state.selectedId = parentId ?? state.rootId;
        if (state.currentFolderId === id) state.currentFolderId = state.rootId;
      });
    },

    listChildren: (id: string) => {
      const node = get().nodesById[id];
      if (!node || node.type !== 'folder') return [];
      return (node.children || []).map((cid) => get().nodesById[cid]).filter(Boolean) as FileNodeData[];
    },

    moveNode: (id: string, newParentId: string) => {
      set((state: FileTreeState) => {
        const node = state.nodesById[id];
        const newParent = state.nodesById[newParentId];
        if (!node || !newParent || newParent.type !== 'folder') return;
        // 防止将文件夹移动到自己的子孙中
        const isDescendant = (targetId: string, maybeAncestorId: string): boolean => {
          const target = state.nodesById[targetId];
          if (!target || target.type !== 'folder') return false;
          const stack = [...(target.children || [])];
          while (stack.length) {
            const cid = stack.pop()!;
            if (cid === maybeAncestorId) return true;
            const child = state.nodesById[cid];
            if (child?.type === 'folder' && child.children) stack.push(...child.children);
          }
          return false;
        };
        if (isDescendant(id, newParentId)) return;

        // 从旧父节点移除
        if (node.parentId && state.nodesById[node.parentId]) {
          const oldParent = state.nodesById[node.parentId];
          oldParent.children = (oldParent.children || []).filter((cid) => cid !== id);
          oldParent.updatedAt = Date.now();
        }
        // 加入新父节点
        node.parentId = newParentId;
        const children = newParent.children || (newParent.children = []);
        children.push(id);
        newParent.updatedAt = Date.now();
        node.updatedAt = Date.now();
      });
    },

    setSelectedId: (id: string | null) => {
      set((state: FileTreeState) => { state.selectedId = id; });
    },

    setCurrentFolderId: (id: string) => {
      set((state: FileTreeState) => { state.currentFolderId = id; });
    },

    getPath: (id: string) => {
      const state = get();
      const parts: string[] = [];
      let cur: FileNodeData | undefined = state.nodesById[id];
      while (cur) {
        parts.push(cur.name);
        if (!cur.parentId) break;
        cur = state.nodesById[cur.parentId];
      }
      return '/' + parts.reverse().join('/');
    },

    findNodeByDocumentId: (docId: string) => {
      const state = get();
      return Object.values(state.nodesById).find((n) => n.documentId === docId);
    },

    linkDocument: (id: string, documentId: string) => {
      set((state: FileTreeState) => {
        const n = state.nodesById[id];
        if (!n || n.type !== 'file') return;
        n.documentId = documentId;
        n.updatedAt = Date.now();
      });
    }
  }))
);

// Persist with debounce
if (typeof window !== 'undefined') {
  let timer: number | null = null;
  useFileTree.subscribe((state: FileTreeState) => {
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
          rootId: state.rootId, 
          nodesById: state.nodesById, 
          selectedId: state.selectedId ?? null,
          currentFolderId: state.currentFolderId ?? state.rootId
        }));
      } catch {}
    }, 400);
  });
}

