import React from 'react';
import { cn } from "@/lib/utils";
import { useLayoutStore } from '@lginxai/luckin-core-legacy';
import { Explorer } from "@/components/explorer";
import { TestPane } from "@/components/test-pane";
import { SearchView } from "@/components/search-view";
import { NotificationCenter } from "@/components/notification-center";
import { SettingsPanel } from "@/components/settings-panel";

export interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { layout } = useLayoutStore();

  const renderContent = () => {
    switch (layout.sidebar.current) {
      case 'explorer':
        return <Explorer />;
      case 'search':
        return <SearchView />;
      case 'git':
        return <div className="p-4">源代码管理面板</div>;
      case 'debug':
        return <div className="p-4">调试面板</div>;
      case 'extensions':
        return <div className="p-4">扩展面板</div>;
      case 'user':
        return <NotificationCenter />;
      case 'test':
        return <TestPane />;
      case 'settings':
        return <SettingsPanel />;
      default:
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
