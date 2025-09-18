import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { IColorTheme } from '../types';

interface ThemeState {
  currentTheme: string;
  themes: IColorTheme[];
  setCurrentTheme: (themeId: string) => void;
  addTheme: (theme: IColorTheme) => void;
  removeTheme: (themeId: string) => void;
  updateTheme: (themeId: string, updates: Partial<IColorTheme>) => void;
}

const defaultThemes: IColorTheme[] = [
  {
    id: 'default-dark',
    label: 'Default Dark+',
    uiTheme: 'vs-dark',
    path: '',
  },
  {
    id: 'default-light',
    label: 'Default Light+',
    uiTheme: 'vs',
    path: '',
  },
  {
    id: 'high-contrast',
    label: 'Default High Contrast',
    uiTheme: 'hc-black',
    path: '',
  },
];

export const useThemeStore = create<ThemeState>()(
  immer((set) => ({
    currentTheme: 'default-dark',
    themes: defaultThemes,

    setCurrentTheme: (themeId: string) =>
      set((state) => {
        const theme = state.themes.find((t) => t.id === themeId);
        if (theme) {
          state.currentTheme = themeId;
        }
      }),

    addTheme: (theme: IColorTheme) =>
      set((state) => {
        const existingIndex = state.themes.findIndex((t) => t.id === theme.id);
        if (existingIndex !== -1) {
          state.themes[existingIndex] = theme;
        } else {
          state.themes.push(theme);
        }
      }),

    removeTheme: (themeId: string) =>
      set((state) => {
        state.themes = state.themes.filter((t) => t.id !== themeId);
        if (state.currentTheme === themeId) {
          state.currentTheme = 'default-dark';
        }
      }),

    updateTheme: (themeId: string, updates: Partial<IColorTheme>) =>
      set((state) => {
        const theme = state.themes.find((t) => t.id === themeId);
        if (theme) {
          Object.assign(theme, updates);
        }
      }),
  }))
);

