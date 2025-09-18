import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ILayout, UniqueId } from '../types';

interface LayoutState {
  layout: ILayout;
  setSplitPanePos: (pos: number[]) => void;
  setHorizontalSplitPanePos: (pos: number[]) => void;
  toggleActivityBar: () => void;
  addActivityItem: (item: { id: string; label: string; icon?: string }) => void;
  removeActivityItem: (id: string) => void;
  togglePanel: () => void;
  toggleSidebar: () => void;
  toggleAuxiliaryBar: () => void;
  toggleMenuBar: () => void;
  toggleStatusBar: () => void;
  setPanelCurrent: (current: UniqueId) => void;
  setSidebarCurrent: (current: UniqueId) => void;
  setAuxiliaryBarCurrent: (current: UniqueId) => void;
  addPanelTab: (id: string, label: string) => void;
  removePanelTab: (id: string) => void;
  setStatusText: (text: string) => void;
  resetLayout: () => void;
}

const defaultLayout: ILayout = {
  splitPanePos: [300, 0],
  horizontalSplitPanePos: [0, 0],
  activityBar: {
    hidden: false,
  },
  activityItems: [
    { id: 'explorer', label: '资源管理器' },
    { id: 'search', label: '搜索' },
    { id: 'git', label: '源代码管理' },
    { id: 'debug', label: '运行和调试' },
    { id: 'extensions', label: '扩展' },
    { id: 'user', label: '用户' },
    { id: 'settings', label: '设置' },
    { id: 'test', label: '测试' },
  ],
  panel: {
    hidden: false,
    current: 'output',
    tabs: [
      { id: 'output', label: '输出' },
      { id: 'problems', label: '问题' },
      { id: 'terminal', label: '终端' },
      { id: 'debug-console', label: '调试控制台' },
    ],
  },
  sidebar: {
    hidden: false,
    current: 'explorer',
  },
  auxiliaryBar: {
    hidden: false,
  },
  menuBar: {
    hidden: false,
  },
  statusBar: {
    hidden: false,
    text: '',
  },
};

export const useLayoutStore = create<LayoutState>()(
  immer((set) => ({
    layout: defaultLayout,

    setSplitPanePos: (pos: number[]) =>
      set((state) => {
        state.layout.splitPanePos = pos;
      }),

    setHorizontalSplitPanePos: (pos: number[]) =>
      set((state) => {
        state.layout.horizontalSplitPanePos = pos;
      }),

    toggleActivityBar: () =>
      set((state) => {
        state.layout.activityBar.hidden = !state.layout.activityBar.hidden;
      }),

    addActivityItem: (item) =>
      set((state) => {
        const list = state.layout.activityItems || (state.layout.activityItems = []);
        if (!list.find(i => i.id === item.id)) list.push(item);
      }),

    removeActivityItem: (id) =>
      set((state) => {
        const list = state.layout.activityItems || [];
        state.layout.activityItems = list.filter(i => i.id !== id);
        if (state.layout.sidebar.current === id) {
          state.layout.sidebar.current = 'explorer';
        }
      }),

    togglePanel: () =>
      set((state) => {
        state.layout.panel.hidden = !state.layout.panel.hidden;
      }),

    toggleSidebar: () =>
      set((state) => {
        state.layout.sidebar.hidden = !state.layout.sidebar.hidden;
      }),

    toggleAuxiliaryBar: () =>
      set((state) => {
        state.layout.auxiliaryBar.hidden = !state.layout.auxiliaryBar.hidden;
      }),

    toggleMenuBar: () =>
      set((state) => {
        state.layout.menuBar.hidden = !state.layout.menuBar.hidden;
      }),

    toggleStatusBar: () =>
      set((state) => {
        state.layout.statusBar.hidden = !state.layout.statusBar.hidden;
      }),

    setPanelCurrent: (current: UniqueId) =>
      set((state) => {
        state.layout.panel.current = current;
      }),

    setSidebarCurrent: (current: UniqueId) =>
      set((state) => {
        state.layout.sidebar.current = current;
      }),

    setAuxiliaryBarCurrent: (current: UniqueId) =>
      set((state) => {
        state.layout.auxiliaryBar.current = current;
      }),

    addPanelTab: (id: string, label: string) =>
      set((state) => {
        const tabs = state.layout.panel.tabs || (state.layout.panel.tabs = []);
        if (!tabs.find(t => t.id === id)) {
          tabs.push({ id, label });
        }
        state.layout.panel.current = id;
        state.layout.panel.hidden = false;
      }),

    removePanelTab: (id: string) =>
      set((state) => {
        const tabs = state.layout.panel.tabs || [];
        state.layout.panel.tabs = tabs.filter(t => t.id !== id);
        if (state.layout.panel.current === id) {
          state.layout.panel.current = state.layout.panel.tabs?.[0]?.id;
        }
      }),

    setStatusText: (text: string) =>
      set((state) => {
        // @ts-ignore
        state.layout.statusBar.text = text;
      }),

    resetLayout: () =>
      set((state) => {
        state.layout = { ...defaultLayout };
      }),
  }))
);
