import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface Tab {
  id: string;
  title: string;
  isActive: boolean;
  isDirty?: boolean;
  isLocked?: boolean;
  filePath?: string;
  documentId?: string;
  groupId?: string;
  color?: string;
  stackId?: string;
  lastActivated?: number;
}

export interface TabGroup {
  id: string;
  name: string;
  color: string;
  tabs: string[]; // tab IDs
  isCollapsed: boolean;
  isLocked: boolean;
  position: number;
}

export interface TabStack {
  id: string;
  tabs: string[]; // tab IDs
  activeTabIndex: number;
  isStacked: boolean;
  stackTitle?: string;
  panelId: string;
}

export interface WorkspaceLayout {
  id: string;
  name: string;
  description?: string;
  panelTree: any; // PanelNode from ObsidianLayout
  tabGroups: Record<string, TabGroup>;
  tabStacks: Record<string, TabStack>;
  createdAt: number;
  isDefault?: boolean;
}

interface NavigationHistory {
  panelId: string;
  history: string[]; // tab IDs
  currentIndex: number;
  maxSize: number;
}

interface TabManagerState {
  tabGroups: Record<string, TabGroup>;
  tabStacks: Record<string, TabStack>;
  workspaceLayouts: Record<string, WorkspaceLayout>;
  navigationHistories: Record<string, NavigationHistory>;
  shortcuts: Record<string, string>;
  settings: {
    maxVisibleTabs: number;
    enableAutoStacking: boolean;
    stackingStrategy: 'overflow' | 'group' | 'manual';
    enableTabGroups: boolean;
    showTabPreview: boolean;
  };
}

interface TabManagerActions extends TabManagerState {
  // Tab Group Management
  createTabGroup: (name: string, color: string, tabIds: string[]) => string;
  updateTabGroup: (groupId: string, updates: Partial<TabGroup>) => void;
  deleteTabGroup: (groupId: string) => void;
  addTabToGroup: (tabId: string, groupId: string) => void;
  removeTabFromGroup: (tabId: string) => void;
  moveTabBetweenGroups: (tabId: string, fromGroupId: string, toGroupId: string) => void;
  
  // Tab Stack Management
  createTabStack: (panelId: string, tabIds: string[]) => string;
  addTabToStack: (tabId: string, stackId: string) => void;
  removeTabFromStack: (tabId: string, stackId: string) => void;
  setStackActiveTab: (stackId: string, tabIndex: number) => void;
  toggleStackMode: (stackId: string) => void;
  
  // Workspace Layout Management
  saveWorkspaceLayout: (name: string, panelTree: any, description?: string) => string;
  loadWorkspaceLayout: (layoutId: string) => WorkspaceLayout | null;
  deleteWorkspaceLayout: (layoutId: string) => void;
  setDefaultLayout: (layoutId: string) => void;
  
  // Navigation Management
  addToHistory: (panelId: string, tabId: string) => void;
  navigateBack: (panelId: string) => string | null;
  navigateForward: (panelId: string) => string | null;
  getRecentTabs: (panelId: string, limit?: number) => string[];
  
  // Settings Management
  updateSettings: (settings: Partial<TabManagerState['settings']>) => void;
  
  // Utility Functions
  getTabsByGroup: (groupId: string) => Tab[];
  getTabsByStack: (stackId: string) => Tab[];
  shouldStackTabs: (panelId: string, tabCount: number) => boolean;
  getGroupColors: () => string[];
}

type TabManagerStore = TabManagerActions;

const DEFAULT_SETTINGS: TabManagerState['settings'] = {
  maxVisibleTabs: 8,
  enableAutoStacking: true,
  stackingStrategy: 'overflow',
  enableTabGroups: true,
  showTabPreview: true,
};

const DEFAULT_GROUP_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
];

const STORAGE_KEY = 'obsidian.clone.tabManager';

const loadInitialState = (): TabManagerState => {
  if (typeof window === 'undefined') {
    return {
      tabGroups: {},
      tabStacks: {},
      workspaceLayouts: {},
      navigationHistories: {},
      shortcuts: {},
      settings: DEFAULT_SETTINGS,
    };
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as TabManagerState;
      return { ...parsed, settings: { ...DEFAULT_SETTINGS, ...parsed.settings } };
    }
  } catch {}
  return {
    tabGroups: {},
    tabStacks: {},
    workspaceLayouts: {},
    navigationHistories: {},
    shortcuts: {},
    settings: DEFAULT_SETTINGS,
  };
};

export const useTabManager = create<TabManagerStore>()(
  immer((set: (fn: (state: TabManagerStore) => void) => void, get: () => TabManagerStore) => ({
    ...loadInitialState(),

    // Tab Group Management
    createTabGroup: (name: string, color: string, tabIds: string[] = []) => {
      const groupId = `group_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const newGroup: TabGroup = {
        id: groupId,
        name,
        color,
        tabs: tabIds,
        isCollapsed: false,
        isLocked: false,
        position: Object.keys(get().tabGroups).length,
      };
      set((state: TabManagerStore) => {
        state.tabGroups[groupId] = newGroup;
      });
      return groupId;
    },

    updateTabGroup: (groupId: string, updates: Partial<TabGroup>) => {
      set((state: TabManagerStore) => {
        if (!state.tabGroups[groupId]) return;
        state.tabGroups[groupId] = { ...state.tabGroups[groupId], ...updates };
      });
    },

    deleteTabGroup: (groupId: string) => {
      set((state: TabManagerStore) => {
        delete state.tabGroups[groupId];
      });
    },

    addTabToGroup: (tabId: string, groupId: string) => {
      set((state: TabManagerStore) => {
        const group = state.tabGroups[groupId];
        if (!group) return;
        if (!group.tabs.includes(tabId)) group.tabs.push(tabId);
      });
    },

    removeTabFromGroup: (tabId: string) => {
      set((state: TabManagerStore) => {
        Object.values(state.tabGroups).forEach((group) => {
          group.tabs = group.tabs.filter((id) => id !== tabId);
        });
      });
    },

    moveTabBetweenGroups: (tabId: string, fromGroupId: string, toGroupId: string) => {
      set((state: TabManagerStore) => {
        const fromGroup = state.tabGroups[fromGroupId];
        const toGroup = state.tabGroups[toGroupId];
        if (!fromGroup || !toGroup) return;
        fromGroup.tabs = fromGroup.tabs.filter((id) => id !== tabId);
        if (!toGroup.tabs.includes(tabId)) toGroup.tabs.push(tabId);
      });
    },

    // Tab Stack Management
    createTabStack: (panelId: string, tabIds: string[] = []) => {
      const stackId = `stack_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const newStack: TabStack = {
        id: stackId,
        tabs: tabIds,
        activeTabIndex: 0,
        isStacked: true,
        panelId,
      };
      set((state: TabManagerStore) => {
        state.tabStacks[stackId] = newStack;
      });
      return stackId;
    },

    addTabToStack: (tabId: string, stackId: string) => {
      set((state: TabManagerStore) => {
        const stack = state.tabStacks[stackId];
        if (!stack) return;
        if (!stack.tabs.includes(tabId)) stack.tabs.push(tabId);
      });
    },

    removeTabFromStack: (tabId: string, stackId: string) => {
      set((state: TabManagerStore) => {
        const stack = state.tabStacks[stackId];
        if (!stack) return;
        const newTabs = stack.tabs.filter((id) => id !== tabId);
        const newActiveIndex = Math.min(stack.activeTabIndex, Math.max(0, newTabs.length - 1));
        stack.tabs = newTabs;
        stack.activeTabIndex = newActiveIndex;
      });
    },

    setStackActiveTab: (stackId: string, tabIndex: number) => {
      set((state: TabManagerStore) => {
        const stack = state.tabStacks[stackId];
        if (!stack) return;
        if (tabIndex < 0 || tabIndex >= stack.tabs.length) return;
        stack.activeTabIndex = tabIndex;
      });
    },

    toggleStackMode: (stackId: string) => {
      set((state: TabManagerStore) => {
        const stack = state.tabStacks[stackId];
        if (stack) stack.isStacked = !stack.isStacked;
      });
    },

    // Workspace Layout Management
    saveWorkspaceLayout: (name: string, panelTree: any, description?: string) => {
      const layoutId = `layout_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const current = get();
      const newLayout: WorkspaceLayout = {
        id: layoutId,
        name,
        description,
        panelTree,
        tabGroups: { ...current.tabGroups },
        tabStacks: { ...current.tabStacks },
        createdAt: Date.now(),
      };
      set((state: TabManagerStore) => {
        state.workspaceLayouts[layoutId] = newLayout;
      });
      return layoutId;
    },

    loadWorkspaceLayout: (layoutId: string) => {
      const layout = get().workspaceLayouts[layoutId];
      if (!layout) return null;
      set((state: TabManagerStore) => {
        state.tabGroups = { ...layout.tabGroups };
        state.tabStacks = { ...layout.tabStacks };
      });
      return layout;
    },

    deleteWorkspaceLayout: (layoutId: string) => {
      set((state: TabManagerStore) => {
        delete state.workspaceLayouts[layoutId];
      });
    },

    setDefaultLayout: (layoutId: string) => {
      set((state: TabManagerStore) => {
        Object.values(state.workspaceLayouts).forEach((layout) => {
          layout.isDefault = layout.id === layoutId;
        });
      });
    },

    // Navigation Management
    addToHistory: (panelId: string, tabId: string) => {
      set((state: TabManagerStore) => {
        const history = state.navigationHistories[panelId] || {
          panelId,
          history: [],
          currentIndex: -1,
          maxSize: 50,
        };
        const newHistory = [...history.history];
        const existingIndex = newHistory.indexOf(tabId);
        if (existingIndex > -1) newHistory.splice(existingIndex, 1);
        newHistory.push(tabId);
        if (newHistory.length > history.maxSize) newHistory.shift();
        state.navigationHistories[panelId] = {
          ...history,
          history: newHistory,
          currentIndex: newHistory.length - 1,
        };
      });
    },

    navigateBack: (panelId: string) => {
      const history = get().navigationHistories[panelId];
      if (!history || history.currentIndex <= 0) return null;
      const newIndex = history.currentIndex - 1;
      const tabId = history.history[newIndex];
      set((state: TabManagerStore) => {
        state.navigationHistories[panelId] = { ...history, currentIndex: newIndex };
      });
      return tabId;
    },

    navigateForward: (panelId: string) => {
      const history = get().navigationHistories[panelId];
      if (!history || history.currentIndex >= history.history.length - 1) return null;
      const newIndex = history.currentIndex + 1;
      const tabId = history.history[newIndex];
      set((state: TabManagerStore) => {
        state.navigationHistories[panelId] = { ...history, currentIndex: newIndex };
      });
      return tabId;
    },

    getRecentTabs: (panelId: string, limit: number = 10) => {
      const history = get().navigationHistories[panelId];
      if (!history) return [];
      return history.history.slice(-limit).reverse();
    },

    // Settings Management
    updateSettings: (settings: Partial<TabManagerState['settings']>) => {
      set((state: TabManagerStore) => {
        state.settings = { ...state.settings, ...settings };
      });
    },

    // Utility Functions
    getTabsByGroup: (groupId: string) => {
      const group = get().tabGroups[groupId];
      return group ? group.tabs.map((id) => ({ id } as Tab)) : [];
    },

    getTabsByStack: (stackId: string) => {
      const stack = get().tabStacks[stackId];
      return stack ? stack.tabs.map((id) => ({ id } as Tab)) : [];
    },

    shouldStackTabs: (panelId: string, tabCount: number) => {
      const settings = get().settings;
      return settings.enableAutoStacking && settings.stackingStrategy === 'overflow' && tabCount > settings.maxVisibleTabs;
    },

    getGroupColors: () => DEFAULT_GROUP_COLORS,
  }))
);

// Persistence: subscribe and debounce save
if (typeof window !== 'undefined') {
  let saveTimer: number | null = null;
  useTabManager.subscribe((state: TabManagerStore) => {
    if (saveTimer) window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {}
    }, 500);
  });
}