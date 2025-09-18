import React, { createContext, useContext, useMemo } from 'react';
import { ExtensionService } from '@lginxai/luckin-core-legacy';
import type { ILuckinConfig, IUseLuckinReturn } from '@lginxai/luckin-core';

interface LuckinProviderProps {
  config: ILuckinConfig;
  children: React.ReactNode;
}

// Create a mock context for now - this will be properly implemented
const LuckinContext = createContext<IUseLuckinReturn | null>(null);

export const LuckinProvider: React.FC<LuckinProviderProps> = ({ 
  config, 
  children 
}) => {
  const context = useMemo<IUseLuckinReturn>(() => {
    // Mock implementation - will be replaced with real services
    const extensionService = new ExtensionService();
    
    return {
      luckin: {
        locale: {
          localize: (key: string, defaultValue?: string) => defaultValue || key,
        },
        builtin: {},
        contextMenu: {},
        auxiliaryBar: {},
        layout: {},
        statusBar: {},
        menuBar: {},
        activityBar: {},
        sidebar: {},
        explorer: {},
        folderTree: {},
        panel: {},
        output: {},
        editor: {},
        colorTheme: {},
        action: {},
        editorTree: {},
        notification: {},
        search: {},
        settings: {},
        monaco: {},
        module: {},
        extension: extensionService,
      },
      monaco: {},
      localize: (key: string, defaultValue?: string) => defaultValue || key,
      modules: {},
      controllers: {},
    };
  }, [config]);

  return (
    <LuckinContext.Provider value={context}>
      {children}
    </LuckinContext.Provider>
  );
};

export const useLuckin = (): IUseLuckinReturn => {
  const context = useContext(LuckinContext);
  if (!context) {
    throw new Error('useLuckin must be used within a LuckinProvider');
  }
  return context;
};

