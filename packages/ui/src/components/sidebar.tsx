import React from 'react';
import { cn } from "../lib/utils";
import { useLayoutStore } from '@lgnixai/luckin-core';
import { Explorer } from "./explorer";
import { TestPane } from "./test-pane";
import { SearchView } from "./search-view";
import { NotificationCenter } from "./notification-center";
import { SettingsPanel } from "./settings-panel";
import { ExtensionManager } from "./extension-manager";
import { PluginContentRenderer } from "./plugin-content-renderer";

export interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { layout } = useLayoutStore();

  const renderContent = () => {
    const current = layout.sidebar.current;
    
    // 首先检查是否是系统内置面板
    switch (current) {
      case 'explorer':
        return <Explorer />;
      case 'search':
        return <SearchView />;
      case 'git':
        return <div className="p-4">源代码管理面板</div>;
      case 'debug':
        return <div className="p-4">调试面板</div>;
      case 'extensions':
        return <ExtensionManager />;
      case 'user':
        return <NotificationCenter />;
      case 'test':
        return <TestPane />;
      case 'settings':
        return <SettingsPanel />;
      default:
        // 检查是否是插件ID
        const isPlugin = layout.activityItems?.some(item => item.id === current && 
          !['explorer', 'search', 'git', 'debug', 'extensions', 'user', 'test', 'settings'].includes(item.id)
        );
        
        if (isPlugin) {
          return <PluginContentRenderer pluginId={current} />;
        }
        
        // 默认显示资源管理器
        return <Explorer />;
    }
  };

  return (
    <div data-testid="sidebar" className={cn("w-full bg-sidebar flex flex-col h-full overflow-hidden", className)}>
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};
