import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { IEditorGroup, IEditorTab, UniqueId, PanelNode, TabType } from '../types';

interface EditorState {
  groups: IEditorGroup[];
  currentGroup: UniqueId | null;
  currentTab: UniqueId | null;
  // Obsidian-style panel tree
  panelTree: PanelNode | null;
  addGroup: (group: IEditorGroup) => void;
  removeGroup: (groupId: UniqueId) => void;
  setCurrentGroup: (groupId: UniqueId) => void;
  addTab: (groupId: UniqueId, tab: IEditorTab) => void;
  removeTab: (groupId: UniqueId, tabId: UniqueId) => void;
  setCurrentTab: (groupId: UniqueId, tabId: UniqueId) => void;
  updateTab: (groupId: UniqueId, tabId: UniqueId, updates: Partial<IEditorTab>) => void;
  closeAllTabs: (groupId: UniqueId) => void;
  closeOtherTabs: (groupId: UniqueId, tabId: UniqueId) => void;
  closeTabsToRight: (groupId: UniqueId, tabId: UniqueId) => void;
  closeTabsToLeft: (groupId: UniqueId, tabId: UniqueId) => void;
  moveTab: (groupId: UniqueId, fromIndex: number, toIndex: number) => void;
  duplicateTab: (groupId: UniqueId, tabId: UniqueId) => void;
  // Panel actions
  initializePanelTree: (tree?: PanelNode) => void;
  splitPanel: (panelId: string, direction: 'horizontal' | 'vertical') => void;
  addTabToPanel: (panelId: string, tab: TabType) => void;
  closeTabInPanel: (panelId: string, tabId: string) => void;
  activateTabInPanel: (panelId: string, tabId: string) => void;
}

export const useEditorStore = create<EditorState>()(
  immer((set) => ({
    groups: [],
    currentGroup: null,
    currentTab: null,
    panelTree: null,

    addGroup: (group: IEditorGroup) =>
      set((state) => {
        state.groups.push(group);
        if (!state.currentGroup) {
          state.currentGroup = group.id;
        }
      }),

    removeGroup: (groupId: UniqueId) =>
      set((state) => {
        const index = state.groups.findIndex((g) => g.id === groupId);
        if (index !== -1) {
          state.groups.splice(index, 1);
          if (state.currentGroup === groupId) {
            state.currentGroup = state.groups.length > 0 ? state.groups[0].id : null;
          }
        }
      }),

    setCurrentGroup: (groupId: UniqueId) =>
      set((state) => {
        state.currentGroup = groupId;
        const group = state.groups.find((g) => g.id === groupId);
        if (group && group.activeTab) {
          state.currentTab = group.activeTab;
        }
      }),

    addTab: (groupId: UniqueId, tab: IEditorTab) =>
      set((state) => {
        const group = state.groups.find((g) => g.id === groupId);
        if (group) {
          // Check if tab already exists
          const existingTab = group.tabs.find((t) => t.id === tab.id);
          if (!existingTab) {
            group.tabs.push(tab);
            group.activeTab = tab.id;
            state.currentTab = tab.id;
          } else {
            // Switch to existing tab
            group.activeTab = tab.id;
            state.currentTab = tab.id;
          }
        }
      }),

    removeTab: (groupId: UniqueId, tabId: UniqueId) =>
      set((state) => {
        const group = state.groups.find((g) => g.id === groupId);
        if (group) {
          const tabIndex = group.tabs.findIndex((t) => t.id === tabId);
          if (tabIndex !== -1) {
            group.tabs.splice(tabIndex, 1);
            
            // Set new active tab
            if (group.activeTab === tabId) {
              if (group.tabs.length > 0) {
                const newActiveIndex = Math.min(tabIndex, group.tabs.length - 1);
                group.activeTab = group.tabs[newActiveIndex].id;
                state.currentTab = group.activeTab;
              } else {
                group.activeTab = undefined;
                state.currentTab = null;
              }
            }
          }
        }
      }),

    setCurrentTab: (groupId: UniqueId, tabId: UniqueId) =>
      set((state) => {
        const group = state.groups.find((g) => g.id === groupId);
        if (group) {
          const tab = group.tabs.find((t) => t.id === tabId);
          if (tab) {
            group.activeTab = tabId;
            state.currentTab = tabId;
            state.currentGroup = groupId;
          }
        }
      }),

    updateTab: (groupId: UniqueId, tabId: UniqueId, updates: Partial<IEditorTab>) =>
      set((state) => {
        const group = state.groups.find((g) => g.id === groupId);
        if (group) {
          const tab = group.tabs.find((t) => t.id === tabId);
          if (tab) {
            Object.assign(tab, updates);
          }
        }
      }),

    closeAllTabs: (groupId: UniqueId) =>
      set((state) => {
        const group = state.groups.find((g) => g.id === groupId);
        if (group) {
          group.tabs = [];
          group.activeTab = undefined;
          if (state.currentGroup === groupId) {
            state.currentTab = null;
          }
        }
      }),

    closeOtherTabs: (groupId: UniqueId, tabId: UniqueId) =>
      set((state) => {
        const group = state.groups.find((g) => g.id === groupId);
        if (group) {
          group.tabs = group.tabs.filter((t) => t.id === tabId);
          group.activeTab = tabId;
          state.currentTab = tabId;
        }
      }),

    closeTabsToRight: (groupId: UniqueId, tabId: UniqueId) =>
      set((state) => {
        const group = state.groups.find((g) => g.id === groupId);
        if (group) {
          const tabIndex = group.tabs.findIndex((t) => t.id === tabId);
          if (tabIndex !== -1) {
            group.tabs = group.tabs.slice(0, tabIndex + 1);
            group.activeTab = tabId;
            state.currentTab = tabId;
          }
        }
      }),

    closeTabsToLeft: (groupId: UniqueId, tabId: UniqueId) =>
      set((state) => {
        const group = state.groups.find((g) => g.id === groupId);
        if (group) {
          const tabIndex = group.tabs.findIndex((t) => t.id === tabId);
          if (tabIndex !== -1) {
            group.tabs = group.tabs.slice(tabIndex);
            group.activeTab = tabId;
            state.currentTab = tabId;
          }
        }
      }),

    moveTab: (groupId: UniqueId, fromIndex: number, toIndex: number) =>
      set((state) => {
        const group = state.groups.find((g) => g.id === groupId);
        if (group && fromIndex >= 0 && toIndex >= 0 && fromIndex < group.tabs.length && toIndex < group.tabs.length) {
          const [movedTab] = group.tabs.splice(fromIndex, 1);
          group.tabs.splice(toIndex, 0, movedTab);
        }
      }),

    duplicateTab: (groupId: UniqueId, tabId: UniqueId) =>
      set((state) => {
        const group = state.groups.find((g) => g.id === groupId);
        if (group) {
          const tab = group.tabs.find((t) => t.id === tabId);
          if (tab) {
            const newTab: IEditorTab = {
              ...tab,
              id: `${tab.id}-copy-${Date.now()}`,
              name: `${tab.name} (Copy)`,
              modified: false,
            };
            group.tabs.push(newTab);
            group.activeTab = newTab.id;
            state.currentTab = newTab.id;
          }
        }
      }),

    // Obsidian-style panel tree actions
    initializePanelTree: (tree) =>
      set((state) => {
        state.panelTree =
          tree || {
            id: 'root',
            type: 'split',
            direction: 'horizontal',
            children: [
              {
                id: 'left',
                type: 'leaf',
                tabs: [
                  { id: '1', title: '新标签页', isActive: true },
                ],
                size: 35,
                minSize: 20,
              },
            ],
          };
      }),

    splitPanel: (panelId, direction) =>
      set((state) => {
        const findPanel = (node: PanelNode): PanelNode | null => {
          if (node.id === panelId) return node;
          if (node.children) {
            for (const child of node.children) {
              const found = findPanel(child);
              if (found) return found;
            }
          }
          return null;
        };
        if (!state.panelTree) return;
        const target = findPanel(state.panelTree);
        if (target && target.type === 'leaf') {
          const newLeafId = `${panelId}-split-${Date.now()}`;
          const newLeaf: PanelNode = { id: newLeafId, type: 'leaf', tabs: [] };
          target.type = 'split';
          target.direction = direction;
          target.children = [
            { id: `${panelId}-a`, type: 'leaf', tabs: target.tabs || [] },
            newLeaf,
          ];
          delete (target as any).tabs;
        }
      }),

    addTabToPanel: (panelId, tab) =>
      set((state) => {
        const visit = (node: PanelNode): boolean => {
          if (node.id === panelId && node.type === 'leaf') {
            node.tabs = node.tabs || [];
            node.tabs.forEach((t) => (t.isActive = false));
            node.tabs.push({ ...tab, isActive: true });
            return true;
          }
          if (node.children) return node.children.some(visit);
          return false;
        };
        if (state.panelTree) visit(state.panelTree);
      }),

    closeTabInPanel: (panelId, tabId) =>
      set((state) => {
        const visit = (node: PanelNode): boolean => {
          if (node.id === panelId && node.type === 'leaf' && node.tabs) {
            const idx = node.tabs.findIndex((t) => t.id === tabId);
            if (idx !== -1) {
              const wasActive = !!node.tabs[idx].isActive;
              node.tabs.splice(idx, 1);
              if (wasActive && node.tabs.length > 0) {
                node.tabs[node.tabs.length - 1].isActive = true;
              }
            }
            return true;
          }
          if (node.children) return node.children.some(visit);
          return false;
        };
        if (state.panelTree) visit(state.panelTree);
      }),

    activateTabInPanel: (panelId, tabId) =>
      set((state) => {
        const visit = (node: PanelNode): boolean => {
          if (node.id === panelId && node.type === 'leaf' && node.tabs) {
            node.tabs.forEach((t) => (t.isActive = t.id === tabId));
            return true;
          }
          if (node.children) return node.children.some(visit);
          return false;
        };
        if (state.panelTree) visit(state.panelTree);
      }),
  }))
);
