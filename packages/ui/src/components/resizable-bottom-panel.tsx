import React, { useState, useRef, useCallback } from 'react';
import { cn } from "@/lib/utils";
import { ChevronUp } from 'lucide-react';

export interface ResizableBottomPanelProps {
  children: React.ReactNode;
  className?: string;
  defaultHeight?: number;
  minHeight?: number;
  maxHeight?: number;
  onResize?: (height: number) => void;
  onToggle?: (isVisible: boolean) => void;
  isVisible?: boolean;
}

export const ResizableBottomPanel: React.FC<ResizableBottomPanelProps> = ({
  children,
  className,
  defaultHeight = 200,
  minHeight = 100,
  maxHeight = 600,
  onResize,
  onToggle,
  isVisible = true
}) => {
  const [height, setHeight] = useState(defaultHeight);
  const [isResizing, setIsResizing] = useState(false);
  // const [isMaximized, setIsMaximized] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const startHeightRef = useRef<number>(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startYRef.current = e.clientY;
    startHeightRef.current = height;
  }, [height]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    e.preventDefault();
    const deltaY = startYRef.current - e.clientY; // 向上拖拽增加高度
    const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeightRef.current + deltaY));
    
    if (newHeight !== height) {
      setHeight(newHeight);
      onResize?.(newHeight);
    }
  }, [isResizing, minHeight, maxHeight, onResize, height]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    e.preventDefault();
    setIsResizing(false);
  }, []);

  const handleToggle = useCallback(() => {
    onToggle?.(!isVisible);
  }, [isVisible, onToggle]);

  // const handleMaximize = useCallback(() => {
  //   if (isMaximized) {
  //     setHeight(defaultHeight);
  //     setIsMaximized(false);
  //   } else {
  //     setHeight(maxHeight);
  //     setIsMaximized(true);
  //   }
  // }, [isMaximized, defaultHeight, maxHeight]);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: false });
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
      document.body.style.pointerEvents = 'none';
      
      // 防止页面滚动
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.pointerEvents = '';
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.pointerEvents = '';
      document.body.style.overflow = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  if (!isVisible) {
    return (
      <div className="h-6 bg-statusBar-background border-t flex items-center justify-center">
        <button
          onClick={handleToggle}
          className="p-1 hover:bg-accent rounded"
          title="显示面板"
        >
          <ChevronUp className="w-4 h-4 rotate-180" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* 拖拽手柄 - 增加高度以提高可用性 */}
      <div
        className={cn(
          "h-2 cursor-row-resize transition-colors flex items-center justify-center relative group",
          isResizing ? "bg-blue-500/20" : "bg-transparent hover:bg-blue-400/20"
        )}
        onMouseDown={handleMouseDown}
        title="拖动调整面板高度"
      >
        {/* 视觉指示器 */}
        <div className={cn(
          "w-12 h-1 rounded-full transition-colors",
          isResizing ? "bg-blue-500" : "bg-border group-hover:bg-blue-400"
        )} />
        
        {/* 扩展点击区域 */}
        <div className="absolute inset-x-0 -top-1 -bottom-1" />
      </div>

      {/* 面板内容 */}
      <div
        ref={panelRef}
        className={cn("bg-background border-t", className)}
        style={{ height: `${height}px`, minHeight: `${minHeight}px`, maxHeight: `${maxHeight}px` }}
      >
        {children}
      </div>
    </div>
  );
};
