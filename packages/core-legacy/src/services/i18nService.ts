import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

type LocaleKey = 'zh-CN' | 'en-US';

type Dict = Record<string, string>;

const builtin: Record<LocaleKey, Dict> = {
  'zh-CN': {
    menu_launchpad: '启动台',
    menu_select: '选择',
    menu_view: '查看',
    menu_run: '运行',
    menu_help: '帮助',
  },
  'en-US': {
    menu_launchpad: 'Launchpad',
    menu_select: 'Select',
    menu_view: 'View',
    menu_run: 'Run',
    menu_help: 'Help',
  },
};

interface I18nState {
  locale: LocaleKey;
  resources: Record<string, Dict>;
}

interface I18nService extends I18nState {
  t: (key: string) => string;
  setLocale: (locale: LocaleKey) => void;
  addResources: (locale: string, dict: Dict) => void;
}

export const useI18nService = create<I18nService>()(
  immer((set, get) => ({
    locale: 'zh-CN',
    resources: builtin,

    t: (key) => {
      const { locale, resources } = get();
      return resources[locale]?.[key] ?? key;
    },

    setLocale: (locale) => set((s) => { (s.locale as any) = locale; }),

    addResources: (locale, dict) => set((s) => {
      s.resources[locale] = { ...(s.resources[locale as LocaleKey] || {}), ...dict };
    }),
  }))
);


