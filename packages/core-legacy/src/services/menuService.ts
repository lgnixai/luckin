import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface IMenuItem {
  id: string;
  title: string;
  group?: string;
}

interface MenuServiceState {
  menuItems: IMenuItem[];
  addMenuItem: (item: IMenuItem) => void;
  removeMenuItem: (id: string) => void;
  clear: () => void;
}

export const useMenuService = create<MenuServiceState>()(
  immer((set) => ({
    menuItems: [],
    addMenuItem: (item) =>
      set((state) => {
        state.menuItems.push(item);
      }),
    removeMenuItem: (id) =>
      set((state) => {
        state.menuItems = state.menuItems.filter((m) => m.id !== id);
      }),
    clear: () =>
      set((state) => {
        state.menuItems = [];
      }),
  }))
);


