import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface ICommandItem {
  id: string;
  title: string;
  run?: () => void | Promise<void>;
}

interface CommandServiceState {
  commands: ICommandItem[];
  paletteOpen: boolean;
  register: (cmd: ICommandItem) => void;
  unregister: (id: string) => void;
  execute: (id: string) => Promise<void>;
  togglePalette: (open?: boolean) => void;
}

export const useCommandService = create<CommandServiceState>()(
  immer((set, get) => ({
    commands: [],
    paletteOpen: false,
    register: (cmd) =>
      set((state) => {
        if (!state.commands.find((c) => c.id === cmd.id)) state.commands.push(cmd);
      }),
    unregister: (id) =>
      set((state) => {
        state.commands = state.commands.filter((c) => c.id !== id);
      }),
    execute: async (id) => {
      const cmd = get().commands.find((c) => c.id === id);
      if (cmd?.run) await cmd.run();
    },
    togglePalette: (open) =>
      set((state) => {
        state.paletteOpen = typeof open === 'boolean' ? open : !state.paletteOpen;
      }),
  }))
);


