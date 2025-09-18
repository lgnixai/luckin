/**
 * Luckin Core Legacy - Compatibility layer for existing code
 * @author LGINX AI Corporation
 * @version 3.0.0
 * @deprecated Use @lgnixai/luckin-core instead
 */

// Re-export new core functionality for backward compatibility
export * from '@lgnixai/luckin-core';

// Legacy utilities
export * from './utils/panelTree';

// Legacy stores (with deprecation warnings)
export * from './stores';

// Legacy services (bridge to new services)
export * from './services';

// Legacy hooks (avoid conflicts by being more specific)
export { useLuckin, useLuckinApp } from './hooks/useLuckin';
export { 
  useEditorService,
  useThemeService, 
  useCommandService,
  useNotificationService,
  useTestService,
  useSearchService,
  useMenuService,
  useI18nService,
  useTheme 
} from './hooks/useServices';

// Legacy compatibility exports (avoid conflicts)
export {
  initializeLuckin,
  EditorService,
  ThemeService,
  CommandService,
  NotificationService,
  ExtensionService
} from './compat';