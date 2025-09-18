/**
 * Legacy Compatibility Layer - Bridge between old and new APIs
 * @author LGINX AI Corporation
 * @version 3.0.0
 * @deprecated This is a compatibility layer. Use the new APIs from @lgnixai/luckin-core
 */

import { 
  getGlobalApp,
  type EditorService,
  type ThemeService,
  type CommandService,
  type NotificationService,
  type ILuckinConfig
} from '@lgnixai/luckin-core';

/**
 * @deprecated Use getGlobalApp().getService('editor') instead
 */
export function useEditorService(): EditorService {
  console.warn('useEditorService is deprecated. Use getGlobalApp().getService("editor") instead.');
  return getGlobalApp().getService<EditorService>('editor');
}

/**
 * @deprecated Use getGlobalApp().getService('theme') instead
 */
export function useThemeService(): ThemeService {
  console.warn('useThemeService is deprecated. Use getGlobalApp().getService("theme") instead.');
  return getGlobalApp().getService<ThemeService>('theme');
}

/**
 * @deprecated Use getGlobalApp().getService('command') instead
 */
export function useCommandService(): CommandService {
  console.warn('useCommandService is deprecated. Use getGlobalApp().getService("command") instead.');
  return getGlobalApp().getService<CommandService>('command');
}

/**
 * @deprecated Use getGlobalApp().getService('notification') instead
 */
export function useNotificationService(): NotificationService {
  console.warn('useNotificationService is deprecated. Use getGlobalApp().getService("notification") instead.');
  return getGlobalApp().getService<NotificationService>('notification');
}

/**
 * @deprecated Use initializeGlobalApp() instead
 */
export async function initializeLuckin(config?: ILuckinConfig): Promise<void> {
  console.warn('initializeLuckin is deprecated. Use initializeGlobalApp() instead.');
  const { initializeGlobalApp } = await import('@lgnixai/luckin-core');
  await initializeGlobalApp(config);
}

// Legacy service class exports for backward compatibility
export {
  EditorService,
  ThemeService,
  CommandService,
  NotificationService
} from '@lgnixai/luckin-core';

/**
 * @deprecated Extension service is not implemented in the new architecture
 */
export class ExtensionService {
  constructor() {
    console.warn('ExtensionService is deprecated and not implemented in the new architecture.');
  }

  register() {
    console.log('Extension service not implemented');
  }

  unregister() {
    console.log('Extension service not implemented');
  }

  getExtensions() {
    return [];
  }
}