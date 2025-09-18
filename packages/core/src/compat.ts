// Compatibility layer: temporarily re-expose legacy services/stores/utilities
// to satisfy existing UI imports during the refactor. All exports are typed as
// any to avoid declaration build coupling to the legacy package types.

import * as legacy from '@lginxai/luckin-core-legacy';

// Services
export const useEditorService: any = legacy.useEditorService;
export const useCommandService: any = legacy.useCommandService;
export const useMenuService: any = legacy.useMenuService;
export const useNotificationService: any = legacy.useNotificationService;
export const useSearchService: any = legacy.useSearchService;
export const useI18nService: any = legacy.useI18nService;
export const ExtensionService: any = legacy.ExtensionService;
export const useTestService: any = legacy.useTestService;
export const useThemeService: any = legacy.useThemeService;

// Stores
export const useLayoutStore: any = legacy.useLayoutStore;
export const useThemeStore: any = legacy.useThemeStore;
export const useEditorStore: any = legacy.useEditorStore;

// Types (loose any typings)
export type ILuckinConfig = any;
export type IUseLuckinReturn = any;
export type IEditorTab = any;
export type PanelNode = any;
export type IFileTreeNode = any;

// Panel tree utils
export const findNodeById: any = legacy.findNodeById;
export const findFirstLeaf: any = legacy.findFirstLeaf;
export const updateTabsForPanel: any = legacy.updateTabsForPanel;
export const splitPanelImmutable: any = legacy.splitPanelImmutable;
export const removePanelNodeImmutable: any = legacy.removePanelNodeImmutable;

