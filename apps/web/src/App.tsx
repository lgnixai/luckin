import { LuckinProvider, Workbench, CommandPalette } from '@lginxai/luckin-ui';
import { useEffect } from 'react';
import { useCommandService } from '@lginxai/luckin-core-legacy';
import type { ILuckinConfig } from '@lginxai/luckin-core';
import './index.css';

const config: ILuckinConfig = {
  extensions: [],
  defaultLocale: 'en-US',
  defaultColorTheme: 'default-dark',
};

function App() {
  const { register, togglePalette } = useCommandService();

  useEffect(() => {
    // 注册示例命令
    register({ id: 'welcome.show', title: '打开欢迎页' });
    register({ id: 'panel.toggle', title: '切换底部面板' });

    // 绑定 Ctrl/Cmd+K 打开命令面板
    const onKey = (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'k');
      if (isCmdK) {
        e.preventDefault();
        togglePalette(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [register, togglePalette]);

  return (
    <LuckinProvider config={config}>
      <Workbench className="">
        <div />
      </Workbench>
      <CommandPalette className="" />
    </LuckinProvider>
  );
}

export default App;
