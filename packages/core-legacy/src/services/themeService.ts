import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type ThemeMode = 'light' | 'dark' | 'glass';
export interface ThemeDefinition {
  id: ThemeMode | string;
  label: string;
}

interface ThemeServiceState {
  theme: ThemeMode;
  themes: ThemeDefinition[];
  setTheme: (theme: ThemeMode) => void;
  toggleDark: () => void;
}

export const useThemeService = create<ThemeServiceState>()(
  immer((set) => ({
    theme: 'dark',
    themes: [
      { id: 'dark', label: '默认深色' },
      { id: 'light', label: '默认浅色' },
      { id: 'glass', label: '玻璃拟态' },
    ],
    setTheme: (theme) => set((state) => { state.theme = theme; }),
    toggleDark: () => set((state) => { state.theme = state.theme === 'dark' ? 'light' : 'dark'; }),
  }))
);


