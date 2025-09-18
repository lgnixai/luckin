/**
 * Legacy Luckin Hook - Main application hook
 * @deprecated Use @lgnixai/luckin-core services directly
 */

import { useEffect, useState } from 'react';
import { 
  getGlobalApp,
  initializeGlobalApp,
  type ILuckinConfig,
  type LuckinApplication
} from '@lgnixai/luckin-core';

/**
 * @deprecated Use initializeGlobalApp and getGlobalApp directly
 */
export function useLuckin(config?: ILuckinConfig) {
  console.warn('useLuckin hook is deprecated. Use initializeGlobalApp and getGlobalApp directly.');
  
  const [app, setApp] = useState<LuckinApplication | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const app = await initializeGlobalApp(config);
        if (mounted) {
          setApp(app);
          setIsInitialized(true);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    app: app || getGlobalApp(),
    isInitialized,
    error,
    
    // Legacy service accessors
    editorService: app?.getService('editor'),
    themeService: app?.getService('theme'),
    commandService: app?.getService('command'),
    notificationService: app?.getService('notification')
  };
}

/**
 * @deprecated Use getGlobalApp directly
 */
export function useLuckinApp(): LuckinApplication {
  console.warn('useLuckinApp hook is deprecated. Use getGlobalApp directly.');
  return getGlobalApp();
}