import React, { useState, useRef, useCallback } from 'react';
import { cn } from "@/lib/utils";

export interface ResizablePanelProps {
  children: React.ReactNode;
  className?: string;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  onResize?: (width: number) => void;
  position?: 'left' | 'right'; // 拖拽条位置
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  children,
  className,
  defaultWidth = 300,
  minWidth = 200,
  maxWidth = 600,
  onResize,
  position = 'right'
}) => {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !panelRef.current) return;

    const rect = panelRef.current.getBoundingClientRect();
    let newWidth: number;
    
    if (position === 'right') {
      // 右侧拖拽条：从面板左边缘计算宽度
      newWidth = e.clientX - rect.left;
    } else {
      // 左侧拖拽条：从面板右边缘计算宽度
      newWidth = rect.right - e.clientX;
    }
    
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setWidth(newWidth);
      onResize?.(newWidth);
    }
  }, [isResizing, minWidth, maxWidth, onResize, position]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div className="flex h-full">
      {/* 左侧拖拽条 */}
      {position === 'left' && (
        <div
          className={cn(
            "w-0.5 h-full cursor-col-resize transition-colors",
            isResizing ? "bg-blue-500" : "bg-transparent hover:bg-blue-400"
          )}
          onMouseDown={handleMouseDown}
        />
      )}
      
      <div
        ref={panelRef}
        className={cn("flex-shrink-0 h-full overflow-hidden", className)}
        style={{ width: `${width}px` }}
      >
        {children}
      </div>
      
      {/* 右侧拖拽条 */}
      {position === 'right' && (
        <div
          className={cn(
            "w-0.5 h-full cursor-col-resize transition-colors",
            isResizing ? "bg-blue-500" : "bg-transparent hover:bg-blue-400"
          )}
          onMouseDown={handleMouseDown}
        />
      )}
    </div>
  );
};
