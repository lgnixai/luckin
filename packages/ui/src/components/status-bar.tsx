import React from 'react';
import { cn } from "@/lib/utils";
import { GitBranch, CheckCircle, Bell, Sun, Moon, Sparkles } from 'lucide-react';
import { useLayoutStore, useThemeService } from '@lginxai/luckin-core-legacy';

export interface StatusBarProps {
  className?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({ className }) => {
  const { layout } = useLayoutStore();
  const { theme, toggleDark } = useThemeService();
  return (
    <div data-testid="status-bar" className={cn("h-6 bg-statusBar-background border-t flex items-center justify-between px-2 text-xs", className)}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <GitBranch className="w-3 h-3" />
          <span>main</span>
        </div>
        
        <div className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-green-500" />
          <span>无问题</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <span>{layout.statusBar?.text || '行0, 列0'}</span>
        <button title="浅色/深色" onClick={() => toggleDark()} className="p-0.5 hover:opacity-80">
          {theme === 'dark' ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}
        </button>
        <button title="玻璃主题" onClick={() => {
          const root = document.documentElement;
          root.classList.toggle('glass');
          if (root.classList.contains('glass')) root.classList.add('dark');
        }} className="p-0.5 hover:opacity-80">
          <Sparkles className="w-4 h-4"/>
        </button>
        <Bell className="w-4 h-4" />
      </div>
    </div>
  );
};
