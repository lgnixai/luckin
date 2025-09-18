import React from 'react';
import { cn } from "@/lib/utils";
import { useLayoutStore, useThemeService } from '@lginxai/luckin-core-legacy';
import { Checkbox } from "@/components/checkbox";

export interface SettingsPanelProps {
  className?: string;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ className }) => {
  const { layout, toggleActivityBar, toggleSidebar, toggleAuxiliaryBar, togglePanel, toggleStatusBar } = useLayoutStore();
  const { theme, toggleDark } = useThemeService();

  return (
    <div className={cn('p-4 space-y-4', className)}>
      <div className="text-sm font-medium">外观</div>
      <div className="flex items-center gap-2 text-sm">
        <Checkbox checked={theme === 'dark'} onCheckedChange={() => toggleDark()} /> 暗色主题
      </div>

      <div className="text-sm font-medium">布局</div>
      <div className="space-y-2 text-sm">
        <label className="flex items-center gap-2"><Checkbox checked={!layout.activityBar.hidden} onCheckedChange={toggleActivityBar} /> 活动栏</label>
        <label className="flex items-center gap-2"><Checkbox checked={!layout.sidebar.hidden} onCheckedChange={toggleSidebar} /> 侧边栏</label>
        <label className="flex items-center gap-2"><Checkbox checked={!layout.auxiliaryBar.hidden} onCheckedChange={toggleAuxiliaryBar} /> 辅助栏</label>
        <label className="flex items-center gap-2"><Checkbox checked={!layout.panel.hidden} onCheckedChange={togglePanel} /> 底部面板</label>
        <label className="flex items-center gap-2"><Checkbox checked={!layout.statusBar.hidden} onCheckedChange={toggleStatusBar} /> 状态栏</label>
      </div>
    </div>
  );
};


