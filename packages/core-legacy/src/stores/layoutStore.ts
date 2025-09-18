/**
 * @deprecated This store is deprecated. Use configuration from @lgnixai/luckin-core instead
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { getGlobalApp } from '@lgnixai/luckin-core';

console.warn('layoutStore is deprecated. Use configuration from @lgnixai/luckin-core instead.');

interface LayoutState {
  sidebarVisible: boolean;
  sidebarWidth: number;
  panelVisible: boolean;
  panelHeight: number;
  activityBarVisible: boolean;
  statusBarVisible: boolean;
  menuBarVisible: boolean;
  isFullscreen: boolean;
  
  // Actions
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  togglePanel: () => void;
  setPanelHeight: (height: number) => void;
  toggleActivityBar: () => void;
  toggleStatusBar: () => void;
  toggleMenuBar: () => void;
  toggleFullscreen: () => void;
  resetLayout: () => void;
}

export const useLayoutStore = create<LayoutState>()(
  immer((set, get) => ({
    sidebarVisible: true,
    sidebarWidth: 300,
    panelVisible: true,
    panelHeight: 200,
    activityBarVisible: true,
    statusBarVisible: true,
    menuBarVisible: true,
    isFullscreen: false,

    toggleSidebar: () => {
      console.warn('toggleSidebar is deprecated. Use configuration instead.');
      const app = getGlobalApp();
      const config = app.configuration;
      
      set((state) => {
        state.sidebarVisible = !state.sidebarVisible;
        config.set('ui.showSidebar', state.sidebarVisible);
      });
    },

    setSidebarWidth: (width: number) => {
      set((state) => {
        state.sidebarWidth = Math.max(200, Math.min(800, width));
      });
    },

    togglePanel: () => {
      console.warn('togglePanel is deprecated. Use configuration instead.');
      const app = getGlobalApp();
      const config = app.configuration;
      
      set((state) => {
        state.panelVisible = !state.panelVisible;
        config.set('ui.showPanel', state.panelVisible);
      });
    },

    setPanelHeight: (height: number) => {
      set((state) => {
        state.panelHeight = Math.max(100, Math.min(600, height));
      });
    },

    toggleActivityBar: () => {
      console.warn('toggleActivityBar is deprecated. Use configuration instead.');
      const app = getGlobalApp();
      const config = app.configuration;
      
      set((state) => {
        state.activityBarVisible = !state.activityBarVisible;
        config.set('ui.showActivityBar', state.activityBarVisible);
      });
    },

    toggleStatusBar: () => {
      console.warn('toggleStatusBar is deprecated. Use configuration instead.');
      const app = getGlobalApp();
      const config = app.configuration;
      
      set((state) => {
        state.statusBarVisible = !state.statusBarVisible;
        config.set('ui.showStatusBar', state.statusBarVisible);
      });
    },

    toggleMenuBar: () => {
      console.warn('toggleMenuBar is deprecated. Use configuration instead.');
      const app = getGlobalApp();
      const config = app.configuration;
      
      set((state) => {
        state.menuBarVisible = !state.menuBarVisible;
        config.set('ui.showMenuBar', state.menuBarVisible);
      });
    },

    toggleFullscreen: () => {
      set((state) => {
        state.isFullscreen = !state.isFullscreen;
        
        // Toggle fullscreen API
        if (state.isFullscreen) {
          document.documentElement.requestFullscreen?.();
        } else {
          document.exitFullscreen?.();
        }
      });
    },

    resetLayout: () => {
      set((state) => {
        state.sidebarVisible = true;
        state.sidebarWidth = 300;
        state.panelVisible = true;
        state.panelHeight = 200;
        state.activityBarVisible = true;
        state.statusBarVisible = true;
        state.menuBarVisible = true;
        state.isFullscreen = false;
      });
    },
  }))
);