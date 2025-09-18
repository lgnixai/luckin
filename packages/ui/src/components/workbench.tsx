import React from 'react';
import { cn } from '@/lib/utils';
import { useLayoutStore } from '@lginxai/luckin-core-legacy';
import { ActivityBar } from '@/components/activity-bar';
import { Sidebar } from '@/components/sidebar';
//import { ObsidianEditor } from '@/components/obsidian-editor/obsidian-editor';
import { ObsidianEditor } from '@/components/obeditor';

import { Panel } from '@/components/panel';
import { StatusBar } from '@/components/status-bar';
import { MenuBar } from '@/components/menu-bar';
import { AuxiliaryPane } from '@/components/auxiliary-pane';
import { ResizablePanel } from '@/components/resizable-panel';
import { ResizableBottomPanel } from '@/components/resizable-bottom-panel';

export interface WorkbenchProps {
  className?: string;
  children?: React.ReactNode;
}

export const Workbench: React.FC<WorkbenchProps> = ({ className, children }) => {
  const { layout } = useLayoutStore();

  return (
    <div 
      data-testid="workbench-root" 
      className={cn("flex h-screen w-screen flex-col bg-background text-foreground relative overflow-hidden", className)}
    >
      {/* Menu Bar - 在最顶部，确保最高层级 */}
      {!layout.menuBar.hidden && (
        <div className="relative z-[1000] flex-shrink-0">
          <MenuBar />
        </div>
      )}
      
      {/* 主要内容区域 */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Activity Bar */}
        {!layout.activityBar.hidden && <ActivityBar />}
        
        {/* Sidebar - 可调整大小，使用flex-shrink-0确保不收缩 */}
        {!layout.sidebar.hidden && (
          <div className="flex-shrink-0 relative">
            <ResizablePanel
              defaultWidth={256}
              minWidth={200}
              maxWidth={400}
            >
              <Sidebar />
            </ResizablePanel>
          </div>
        )}
        
        {/* Main Content Area */}
        {/* Main content: 左侧为“编辑器+底部Panel”的纵向列，右侧为辅助栏 */}
        <div className="flex flex-1">
          {/* 编辑器列 */}
          <div className="flex flex-1 flex-col min-w-0 relative z-[1]">
            <div className="flex flex-1 min-h-0">
              <ObsidianEditor />
            </div>

            {/* 底部 Panel 仅与编辑器列对齐 */}
            {!layout.panel.hidden && (
              <ResizableBottomPanel
                defaultHeight={200}
                minHeight={100}
                maxHeight={600}
                isVisible={!layout.panel.hidden}
              >
                <Panel />
              </ResizableBottomPanel>
            )}
          </div>

          {/* 右侧辅助栏（可调整宽度），使用flex-shrink-0确保不收缩 */}
          {!layout.auxiliaryBar.hidden && (
            <div className="flex-shrink-0 relative z-[10]">
              <ResizablePanel
                defaultWidth={256}
                minWidth={200}
                maxWidth={400}
                position="left"
              >
                <AuxiliaryPane />
              </ResizablePanel>
            </div>
          )}
        </div>
      </div>
      
      {/* Status Bar - 在最底部，确保高层级 */}
      {!layout.statusBar.hidden && (
        <div className="relative z-[1000] flex-shrink-0">
          <StatusBar />
        </div>
      )}
      
      {children}
    </div>
  );
};
