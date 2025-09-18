/**
 * Legacy Service Hooks - React hooks for accessing services
 * @deprecated Use services directly from @lgnixai/luckin-core instead
 */

import { useEffect, useState } from 'react';
import { 
  getGlobalApp,
  type EditorService,
  type ThemeService,
  type CommandService,
  type NotificationService
} from '@lgnixai/luckin-core';

/**
 * @deprecated Use getGlobalApp().getService('editor') directly
 */
export function useEditorService(): EditorService {
  console.warn('useEditorService hook is deprecated. Use getGlobalApp().getService("editor") directly.');
  return getGlobalApp().getService<EditorService>('editor');
}

/**
 * @deprecated Use getGlobalApp().getService('theme') directly
 */
export function useThemeService(): ThemeService {
  console.warn('useThemeService hook is deprecated. Use getGlobalApp().getService("theme") directly.');
  return getGlobalApp().getService<ThemeService>('theme');
}

/**
 * @deprecated Use getGlobalApp().getService('command') directly
 */
export function useCommandService(): CommandService {
  console.warn('useCommandService hook is deprecated. Use getGlobalApp().getService("command") directly.');
  return getGlobalApp().getService<CommandService>('command');
}

/**
 * @deprecated Use getGlobalApp().getService('notification') directly
 */
export function useNotificationService(): NotificationService {
  console.warn('useNotificationService hook is deprecated. Use getGlobalApp().getService("notification") directly.');
  return getGlobalApp().getService<NotificationService>('notification');
}

/**
 * @deprecated Test service is not implemented in the new architecture
 */
export function useTestService() {
  console.warn('useTestService is deprecated and not implemented in the new architecture.');
  return {
    runTests: () => console.log('Test service not implemented'),
    getResults: () => [],
    isRunning: false
  };
}

/**
 * @deprecated Search service is not implemented in the new architecture
 */
export function useSearchService() {
  console.warn('useSearchService is deprecated and not implemented in the new architecture.');
  return {
    search: (query: string) => console.log('Search service not implemented:', query),
    getResults: () => [],
    isSearching: false,
    clearResults: () => {}
  };
}

/**
 * @deprecated Menu service is not implemented in the new architecture
 */
export function useMenuService() {
  console.warn('useMenuService is deprecated and not implemented in the new architecture.');
  return {
    getMenuItems: () => [],
    executeMenuItem: (id: string) => console.log('Menu service not implemented:', id),
    registerMenuItem: () => {}
  };
}

/**
 * @deprecated I18n service is not implemented in the new architecture
 */
export function useI18nService() {
  console.warn('useI18nService is deprecated and not implemented in the new architecture.');
  return {
    t: (key: string) => key,
    setLocale: (locale: string) => console.log('I18n service not implemented:', locale),
    getLocale: () => 'en-US'
  };
}

/**
 * @deprecated Use theme service events directly
 */
export function useTheme() {
  console.warn('useTheme hook is deprecated. Use theme service directly.');
  const themeService = useThemeService();
  const [currentTheme, setCurrentTheme] = useState(themeService.currentTheme);

  useEffect(() => {
    const disposable = themeService.onThemeChanged(theme => {
      setCurrentTheme(theme);
    });
    return () => disposable.dispose();
  }, [themeService]);

  return {
    currentTheme,
    setTheme: themeService.setTheme.bind(themeService),
    toggleTheme: themeService.toggleTheme.bind(themeService),
    getThemes: themeService.getThemes.bind(themeService)
  };
}