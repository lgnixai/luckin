import React from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Settings } from 'lucide-react';
import { useLayoutStore } from '@lgnixai/luckin-core';

export interface AuxiliaryPaneProps {
  className?: string;
  title?: string;
}

export const AuxiliaryPane: React.FC<AuxiliaryPaneProps> = ({ 
  className, 
  title = "Auxiliary-63" 
}) => {
  const { layout } = useLayoutStore();
  const computedTitle = (layout.auxiliaryBar.current as string) || title;
  return (
    <div className={cn("w-full bg-sidebar flex flex-col h-full overflow-hidden", className)}>
      {/* Header */}
      <div className="p-2 border-b flex items-center justify-between shrink-0">
        <h3 className="text-sm font-medium text-foreground">{computedTitle}</h3>
        <Button variant="ghost" size="icon" className="w-6 h-6">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">辅助面板</p>
          <p className="text-xs mt-2">此面板可用于显示其他工具和信息。</p>
        </div>
      </div>
    </div>
  );
};
