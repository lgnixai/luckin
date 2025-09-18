/**
 * @deprecated This store is deprecated. Use ThemeService from @lgnixai/luckin-core instead
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { getGlobalApp, type ThemeService, type ITheme } from '@lgnixai/luckin-core';

console.warn('themeStore is deprecated. Use ThemeService from @lgnixai/luckin-core instead.');

interface ThemeState {
  currentTheme: string;
  availableThemes: string[];
  isDark: boolean;
  
  // Actions
  setTheme: (themeId: string) => void;
  toggleTheme: () => void;
  addTheme: (themeId: string) => void;
  removeTheme: (themeId: string) => void;
}

// Get theme service instance
function getThemeService(): ThemeService {
  try {
    return getGlobalApp().getService<ThemeService>('theme');
  } catch {
    // Fallback if app not initialized yet
    return null as any;
  }
}

export const useThemeStore = create<ThemeState>()(
  immer((set, get) => ({
    currentTheme: 'default-dark',
    availableThemes: ['default-light', 'default-dark', 'high-contrast'],
    isDark: true,

    setTheme: (themeId: string) => {
      console.warn('setTheme is deprecated. Use ThemeService.setTheme instead.');
      const themeService = getThemeService();
      if (themeService) {
        themeService.setTheme(themeId);
        return;
      }

      // Fallback to legacy implementation
      set((state) => {
        state.currentTheme = themeId;
        state.isDark = themeId.includes('dark') || themeId === 'high-contrast';
      });
    },

    toggleTheme: () => {
      console.warn('toggleTheme is deprecated. Use ThemeService.toggleTheme instead.');
      const themeService = getThemeService();
      if (themeService) {
        themeService.toggleTheme();
        return;
      }

      // Fallback to legacy implementation
      set((state) => {
        const currentIsDark = state.isDark;
        const newTheme = currentIsDark ? 'default-light' : 'default-dark';
        state.currentTheme = newTheme;
        state.isDark = !currentIsDark;
      });
    },

    addTheme: (themeId: string) => {
      set((state) => {
        if (!state.availableThemes.includes(themeId)) {
          state.availableThemes.push(themeId);
        }
      });
    },

    removeTheme: (themeId: string) => {
      set((state) => {
        state.availableThemes = state.availableThemes.filter(id => id !== themeId);
        if (state.currentTheme === themeId) {
          state.currentTheme = state.availableThemes[0] || 'default-dark';
        }
      });
    },
  }))
);