import React, { useMemo, useState } from 'react';
import { cn } from "@/lib/utils";
import { useLayoutStore } from '@lgnixai/luckin-core';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronUp, X } from 'lucide-react';
// 移除底部的“辅助栏”标签，将辅助栏回归右侧分栏

export interface PanelProps {
  className?: string;
}

export const Panel: React.FC<PanelProps> = ({ className }) => {
  const { layout, togglePanel, setPanelCurrent, removePanelTab } = useLayoutStore();
  const [isMaximized, setIsMaximized] = useState(false);

  const panels = useMemo(() => {
    const builtins = (layout.panel.tabs as any[]) || [{ id: 'output', label: '输出' }];
    return builtins;
  }, [layout.panel.tabs]);

  const currentPanel = (layout.panel.current || 'output').toString();

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const handleClose = () => {
    togglePanel();
  };

  const handleCloseTab = (id: string) => {
    removePanelTab(id);
  };

  const renderPanelContent = (panelId: string) => {
    switch (panelId) {
      case 'output':
        return (
          <div className="h-full bg-background text-foreground p-4">
            <div className="text-sm text-muted-foreground">
              输出日志将在此显示...
            </div>
          </div>
        );
      case 'problems':
        return (
          <div className="h-full bg-background text-foreground p-4">
            <div className="text-sm text-muted-foreground">
              问题列表占位（诊断/错误/警告）。
            </div>
          </div>
        );
      case 'terminal':
        return (
          <div className="h-full bg-background text-foreground p-4">
            <div className="text-sm text-muted-foreground">
              终端占位（shell 会话 / 多实例）。
            </div>
          </div>
        );
      case 'debug-console':
        return (
          <div className="h-full bg-background text-foreground p-4">
            <div className="text-sm text-muted-foreground">
              调试控制台占位（表达式求值 / 输出）。
            </div>
          </div>
        );
      case 'panel-823':
        return (
          <div className="h-full bg-background text-foreground p-4">
            <div className="text-sm text-muted-foreground">
              PANEL-823 内容
            </div>
          </div>
        );
      case 'panel-461':
        return (
          <div className="h-full bg-background text-foreground p-4">
            <div className="text-sm text-muted-foreground">
              PANEL-461 内容
            </div>
          </div>
        );
      case 'panel-727':
        return (
          <div className="h-full bg-background text-foreground p-4">
            <div className="text-sm text-muted-foreground">
              PANEL-727 内容
            </div>
          </div>
        );
      default:
        return (
          <div className="h-full bg-background text-foreground p-4">
            <div className="text-sm text-muted-foreground">
              面板内容
            </div>
          </div>
        );
    }
  };

  return (
    <div className={cn("border-t bg-background", className)}>
      <Tabs value={currentPanel} className="h-full flex flex-col">
        {/* 标签页头部 */}
        <div className="flex items-center justify-between border-b bg-muted/50">
          <TabsList className="flex w-auto items-center gap-1 h-9 bg-transparent overflow-x-auto">
            {panels.map((panel) => (
              <TabsTrigger
                key={panel.id}
                value={panel.id}
                onClick={() => setPanelCurrent(panel.id)}
                className="text-xs px-3 py-1 rounded-t-md border border-transparent data-[state=active]:bg-background"
              >
                <span className="mr-1">{panel.label}</span>
                {panel.id !== 'output' && (
                  <button className="ml-1 hover:bg-muted rounded p-0.5" onClick={(e) => { e.stopPropagation(); handleCloseTab(panel.id); }}>
                    <X className="w-3 h-3" />
                  </button>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {/* 控制按钮 */}
          <div className="flex items-center gap-1 px-2">
            <button
              onClick={handleMaximize}
              className="p-1 hover:bg-accent rounded"
              title={isMaximized ? "还原" : "最大化"}
            >
              <ChevronUp className={cn("w-4 h-4", isMaximized && "rotate-180")} />
            </button>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-accent rounded"
              title="关闭"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* 面板内容 */}
        {panels.map((panel: any) => (
          <TabsContent
            key={panel.id}
            value={panel.id}
            className="flex-1 m-0"
          >
            {renderPanelContent(panel.id)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
