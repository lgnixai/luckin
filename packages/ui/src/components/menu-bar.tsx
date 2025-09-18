import React from 'react';
import { cn } from "@/lib/utils";
import { useMenuService, useI18nService, useLayoutStore, useThemeService } from '@lginxai/luckin-core-legacy';

export interface MenuBarProps {
  className?: string;
}

export const MenuBar: React.FC<MenuBarProps> = ({ className }) => {
  const { menuItems } = useMenuService();
  const { t, locale, setLocale } = useI18nService();
  const { toggleActivityBar, toggleSidebar, toggleAuxiliaryBar, togglePanel, toggleStatusBar } = useLayoutStore();
  const { themes, setTheme } = useThemeService();
  const staticItems = [
    t('menu_launchpad'),
    t('menu_select'), 
    t('menu_view'),
    t('menu_run'),
    t('menu_help')
  ];

  const handleMenuClick = (item: string) => {
    console.log(`菜单项被点击: ${item}`);
    switch (item) {
      case '启动台':
        console.log('打开启动台');
        break;
      case '选择':
        console.log('选择功能');
        break;
      case '查看':
        console.log('查看功能');
        break;
      case '运行':
        console.log('运行功能');
        break;
      case '帮助':
        console.log('帮助功能');
        break;
      default:
        console.log(`未知菜单项: ${item}`);
    }
  };

  const merged = [...staticItems, ...menuItems.map((m: any) => m.title)];

  return (
    <div data-testid="menu-bar" className={cn("h-8 bg-menuBar-background border-b flex items-center px-4", className)}>
      {merged.map((item) => (
        <button
          key={item}
          onClick={() => handleMenuClick(item)}
          className="h-full px-3 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
        >
          {item}
        </button>
      ))}

      <div className="relative group">
        <button className="h-full px-3 text-sm">{t('menu_view')}</button>
        <div className="absolute hidden group-hover:block top-full left-0 bg-popover border rounded shadow min-w-[180px]">
          <button className="block w-full text-left px-3 py-1.5 text-sm hover:bg-accent" onClick={toggleActivityBar}>切换活动栏</button>
          <button className="block w-full text-left px-3 py-1.5 text-sm hover:bg-accent" onClick={toggleSidebar}>切换侧边栏</button>
          <button className="block w-full text-left px-3 py-1.5 text-sm hover:bg-accent" onClick={toggleAuxiliaryBar}>切换辅助栏</button>
          <button className="block w-full text-left px-3 py-1.5 text-sm hover:bg-accent" onClick={togglePanel}>切换底部面板</button>
          <button className="block w-full text-left px-3 py-1.5 text-sm hover:bg-accent" onClick={toggleStatusBar}>切换状态栏</button>
        </div>
      </div>

      <div className="relative group">
        <button className="h-full px-3 text-sm">{t('menu_help')}</button>
        <div className="absolute hidden group-hover:block top-full left-0 bg-popover border rounded shadow min-w-[180px] p-1">
          {themes.map((th: any) => (
            <button key={th.id} className="block w-full text-left px-3 py-1.5 text-sm hover:bg-accent" onClick={() => setTheme(th.id as any)}>
              主题：{th.label}
            </button>
          ))}
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button onClick={() => setLocale(locale === 'zh-CN' ? 'en-US' : 'zh-CN')} className="h-full px-2 text-xs opacity-70 hover:opacity-100">
          {locale === 'zh-CN' ? 'EN' : '中'}
        </button>
      </div>
    </div>
  );
};
