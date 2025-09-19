import { LuckinProvider, Workbench, CommandPalette } from '@lgnixai/luckin-ui';
import { useEffect } from 'react';
import { useCommandService, GreenserverPluginService } from '@lgnixai/luckin-core';
import type { ILuckinConfig } from '@lgnixai/luckin-core';
import './index.css';

// 初始化Greenserver插件服务
const pluginService = new GreenserverPluginService('http://localhost:6066');

const config: ILuckinConfig = {
  extensions: [],
  defaultLocale: 'en-US',
  defaultColorTheme: 'default-dark',
  pluginService, // 添加插件服务到配置
};

function App() {
  const { register, togglePalette } = useCommandService();

  useEffect(() => {
    // 初始化插件服务
    pluginService.initialize().catch(console.error);

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
    return () => {
      window.removeEventListener('keydown', onKey);
      pluginService.dispose(); // 清理插件服务
    };
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
