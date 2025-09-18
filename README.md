# Luckin - 现代化 Web IDE 框架

<div align="center">

![Luckin Logo](https://img.shields.io/badge/Luckin-3.0.0--alpha.0-blue.svg)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/lginxai/luckin)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2+-61dafb.svg)](https://reactjs.org/)

*一个基于 React.js 和 shadcn/ui 构建的现代化 Web IDE UI 框架，灵感来源于 VSCode*

[功能特性](#功能特性) • [快速开始](#快速开始) • [文档](#文档) • [示例](#示例) • [贡献](#贡献)

</div>

## 🌟 功能特性

### 🎨 现代化 UI 设计
- **基于 shadcn/ui** - 美观、一致的设计系统
- **Tailwind CSS** - 高度可定制的样式系统
- **响应式设计** - 支持各种屏幕尺寸
- **无障碍访问** - 符合 WCAG 标准

### 🏗️ 强大的架构
- **模块化设计** - 清晰的包结构和依赖管理
- **TypeScript 支持** - 完整的类型安全
- **依赖注入** - 灵活的服务管理
- **事件驱动** - 松耦合的组件通信

### ⚡ 高性能
- **懒加载** - 按需加载组件和功能
- **虚拟化** - 大数据集的高效渲染
- **性能监控** - 内置性能优化工具
- **缓存策略** - 智能的数据缓存

### 🔧 开发体验
- **热重载** - 快速的开发反馈
- **命令面板** - VSCode 风格的命令系统
- **插件系统** - 可扩展的功能架构
- **调试工具** - 内置的开发调试功能

## 📦 包结构

```
@lginxai/luckin/
├── packages/
│   ├── core/              # 核心架构和服务
│   ├── core-legacy/       # 遗留兼容层
│   ├── types/             # TypeScript 类型定义
│   ├── shared/            # 共享工具和常量
│   └── ui/                # UI 组件库
└── apps/
    └── web/               # Web 应用示例
```

### 📋 包说明

| 包名 | 描述 | 主要功能 |
|------|------|----------|
| `@lginxai/luckin-core` | 核心架构 | 依赖注入、事件系统、生命周期管理 |
| `@lginxai/luckin-core-legacy` | 遗留兼容层 | 向后兼容、服务桥接 |
| `@lginxai/luckin-types` | 类型定义 | TypeScript 接口和类型 |
| `@lginxai/luckin-shared` | 共享工具 | 工具函数、常量、错误处理 |
| `@lginxai/luckin-ui` | UI 组件库 | React 组件、主题、样式 |
| `@lginxai/luckin-web` | Web 应用 | 完整的 IDE 应用示例 |

## 🚀 快速开始

### 📋 系统要求

- **Node.js** >= 18.0.0
- **pnpm** >= 9.0.0 (推荐包管理器)
- **现代浏览器** (支持 ES2022)

### 📥 安装

```bash
# 克隆仓库
git clone https://github.com/lginxai/luckin.git
cd luckin

# 安装依赖
pnpm install

# 构建所有包
pnpm build

# 启动开发服务器
pnpm dev
```

### 🎯 基本使用

```tsx
import React from 'react';
import { LuckinProvider, Workbench, CommandPalette } from '@lginxai/luckin-ui';
import type { ILuckinConfig } from '@lginxai/luckin-core';

const config: ILuckinConfig = {
  extensions: [],
  defaultLocale: 'zh-CN',
  defaultColorTheme: 'default-dark',
};

function App() {
  return (
    <LuckinProvider config={config}>
      <Workbench className="h-screen">
        {/* 您的 IDE 内容 */}
      </Workbench>
      <CommandPalette className="" />
    </LuckinProvider>
  );
}

export default App;
```

## 🎨 主要组件

### 🏢 Workbench - 工作台
IDE 的主要容器，提供布局和面板管理。

```tsx
import { Workbench } from '@lginxai/luckin-ui';

<Workbench className="h-screen">
  {/* 自动渲染编辑器、侧边栏、状态栏等 */}
</Workbench>
```

### 🎯 CommandPalette - 命令面板
VSCode 风格的命令面板，支持快捷键 `Ctrl/Cmd + K`。

```tsx
import { CommandPalette } from '@lginxai/luckin-ui';

<CommandPalette className="" />
```

### 📁 Explorer - 文件浏览器
树形文件浏览器，支持文件操作和上下文菜单。

```tsx
import { Explorer } from '@lginxai/luckin-ui';

<Explorer className="w-64" />
```

### 📝 Editor - 编辑器
基于 Monaco Editor 的代码编辑器，支持多种语言。

```tsx
import { Editor } from '@lginxai/luckin-ui';

<Editor 
  language="typescript"
  value={code}
  onChange={handleCodeChange}
/>
```

## 🔧 高级功能

### 🔌 插件系统

```tsx
import { ExtensionService } from '@lginxai/luckin-core-legacy';

const extensionService = new ExtensionService();

// 注册插件
extensionService.register({
  id: 'my-plugin',
  name: '我的插件',
  activate: () => {
    console.log('插件已激活');
  }
});
```

### 🎨 主题系统

```tsx
import { useThemeService } from '@lginxai/luckin-core-legacy';

function ThemeSelector() {
  const { setTheme, getCurrentTheme } = useThemeService();
  
  return (
    <select onChange={(e) => setTheme(e.target.value)}>
      <option value="default-light">浅色主题</option>
      <option value="default-dark">深色主题</option>
      <option value="high-contrast">高对比度</option>
    </select>
  );
}
```

### 💾 状态管理

```tsx
import { useDocuments, useTabManager } from '@lginxai/luckin-ui';

function DocumentManager() {
  const { createDocument, documents } = useDocuments();
  const { openTab, closeTab } = useTabManager();
  
  const handleCreateFile = () => {
    const docId = createDocument('新文件.md', {
      content: '# 新文档\n\n开始编写...',
      language: 'markdown'
    });
    openTab({
      id: docId,
      title: '新文件.md',
      documentId: docId
    });
  };
  
  return (
    <button onClick={handleCreateFile}>
      创建新文档
    </button>
  );
}
```

## 🛠️ 开发

### 📂 项目结构

```
luckin/
├── apps/
│   └── web/                    # Web 应用示例
│       ├── src/
│       │   ├── App.tsx        # 主应用组件
│       │   └── main.tsx       # 应用入口
│       └── vite.config.ts     # Vite 配置
├── packages/
│   ├── core/                   # 核心架构
│   │   ├── src/foundation/    # 基础设施
│   │   │   ├── di/           # 依赖注入
│   │   │   ├── events/       # 事件系统
│   │   │   └── lifecycle/    # 生命周期
│   │   └── src/services/     # 核心服务
│   ├── core-legacy/          # 遗留兼容
│   │   ├── src/hooks/        # React Hooks
│   │   ├── src/services/     # 遗留服务
│   │   └── src/stores/       # 状态存储
│   ├── types/                # 类型定义
│   │   ├── src/core/         # 核心类型
│   │   ├── src/extensions/   # 扩展类型
│   │   └── src/ui/           # UI 类型
│   ├── shared/               # 共享工具
│   │   ├── src/constants/    # 常量定义
│   │   ├── src/utils/        # 工具函数
│   │   └── src/testing/      # 测试工具
│   └── ui/                   # UI 组件
│       ├── src/components/   # React 组件
│       ├── src/hooks/        # UI Hooks
│       ├── src/stores/       # UI 状态
│       └── src/styles/       # 样式文件
└── scripts/                  # 构建脚本
```

### 🔨 开发命令

```bash
# 开发模式 (所有包)
pnpm dev

# 构建所有包
pnpm build

# 类型检查
pnpm type-check

# 代码检查
pnpm lint

# 代码格式化
pnpm format

# 清理构建产物
pnpm clean

# 运行测试
pnpm test
```

### 📊 单独构建包

```bash
# 构建核心包
cd packages/core && pnpm build

# 构建 UI 包
cd packages/ui && pnpm build

# 构建 Web 应用
cd apps/web && pnpm build
```

## 🎮 示例和演示

### 🖥️ 在线演示
访问 [Luckin 演示站点](https://luckin-demo.vercel.app) 查看实际效果。

### 📚 代码示例

#### 创建简单的 IDE

```tsx
import React from 'react';
import { 
  LuckinProvider, 
  Workbench, 
  Explorer, 
  Editor,
  CommandPalette 
} from '@lginxai/luckin-ui';

function SimpleIDE() {
  const config = {
    extensions: [],
    defaultLocale: 'zh-CN',
    defaultColorTheme: 'default-dark',
  };

  return (
    <LuckinProvider config={config}>
      <div className="flex h-screen">
        <Explorer className="w-64 border-r" />
        <div className="flex-1">
          <Editor 
            language="javascript"
            defaultValue="// 欢迎使用 Luckin IDE\nconsole.log('Hello, Luckin!');"
          />
        </div>
      </div>
      <CommandPalette />
    </LuckinProvider>
  );
}
```

#### 自定义主题

```tsx
import { useThemeService } from '@lginxai/luckin-core-legacy';

const customTheme = {
  id: 'my-theme',
  label: '我的主题',
  colors: {
    'editor.background': '#1e1e1e',
    'editor.foreground': '#d4d4d4',
    // 更多颜色配置...
  }
};

function MyApp() {
  const { registerTheme, setTheme } = useThemeService();
  
  React.useEffect(() => {
    registerTheme(customTheme);
    setTheme('my-theme');
  }, []);

  return <Workbench />;
}
```

## 🏗️ 架构设计

### 🔄 依赖注入系统

```tsx
import { Injectable, Inject, Container } from '@lginxai/luckin-core';

@Injectable('my-service')
class MyService {
  constructor(
    @Inject('logger') private logger: ILogger,
    @Inject('storage') private storage: IStorage
  ) {}
  
  async doSomething() {
    this.logger.info('执行操作...');
    await this.storage.set('key', 'value');
  }
}
```

### 📡 事件系统

```tsx
import { EventBus, EventHandler } from '@lginxai/luckin-core';

class DocumentService {
  private eventBus = EventBus.getInstance('document');
  
  @EventHandler('document:created')
  onDocumentCreated(doc: IDocument) {
    console.log('文档已创建:', doc.title);
  }
  
  createDocument(title: string) {
    const doc = { id: generateId(), title };
    this.eventBus.emit('document:created', doc);
    return doc;
  }
}
```

### 🔧 服务管理

```tsx
import { BaseService } from '@lginxai/luckin-core';

export class EditorService extends BaseService<IEditorConfig> {
  protected async onInitialize() {
    // 初始化编辑器
    console.log('编辑器服务已初始化');
  }
  
  protected onDispose() {
    // 清理资源
    console.log('编辑器服务已销毁');
  }
  
  protected onConfigChanged(oldConfig: IEditorConfig, newConfig: IEditorConfig) {
    // 配置变更处理
    console.log('编辑器配置已更新');
  }
}
```

## 🎨 UI 组件库

### 📦 核心组件

- **Workbench** - 主工作台容器
- **Explorer** - 文件浏览器
- **Editor** - 代码编辑器
- **CommandPalette** - 命令面板
- **StatusBar** - 状态栏
- **MenuBar** - 菜单栏
- **ActivityBar** - 活动栏
- **Panel** - 可调整大小的面板

### 🎛️ 高级组件

- **ObsidianLayout** - Obsidian 风格的编辑器布局
- **TabManager** - 多标签页管理
- **SplitPane** - 分割面板
- **ResizablePanel** - 可调整大小的面板
- **DragDropManager** - 拖拽管理器

## 🔌 扩展开发

### 创建插件

```tsx
import { IExtension } from '@lginxai/luckin-types';

export const myExtension: IExtension = {
  id: 'my-extension',
  name: '我的扩展',
  version: '1.0.0',
  
  activate(context) {
    // 注册命令
    context.commands.register({
      id: 'my-extension.hello',
      title: '打招呼',
      handler: () => {
        context.notifications.show({
          type: 'info',
          message: '你好，Luckin！'
        });
      }
    });
    
    // 注册菜单项
    context.menus.register({
      id: 'my-menu',
      label: '我的菜单',
      commands: ['my-extension.hello']
    });
  },
  
  deactivate() {
    // 清理资源
  }
};
```

## 🎯 使用场景

### 💻 代码编辑器
- 在线代码编辑和预览
- 多语言语法高亮
- 智能代码补全
- 错误检查和提示

### 📊 数据可视化工具
- 图表编辑器
- 数据分析界面
- 报表设计器

### 🎨 设计工具
- UI 设计器
- 原型制作工具
- 组件库管理

### 📚 文档编辑器
- Markdown 编辑器
- 技术文档系统
- 知识库管理

## 🧪 测试

```bash
# 运行所有测试
pnpm test

# 运行特定包的测试
pnpm test --filter @lginxai/luckin-ui

# 运行集成测试
pnpm test:integration

# 生成测试覆盖率报告
pnpm test:coverage
```

## 📚 文档

- [API 文档](./docs/api.md)
- [组件文档](./docs/components.md)
- [插件开发指南](./docs/plugin-development.md)
- [主题定制指南](./docs/theming.md)
- [架构设计](./docs/architecture.md)

## 🤝 贡献

我们欢迎所有形式的贡献！

### 🛠️ 开发流程

1. **Fork** 项目
2. **创建** 功能分支 (`git checkout -b feature/amazing-feature`)
3. **提交** 更改 (`git commit -m 'Add some amazing feature'`)
4. **推送** 分支 (`git push origin feature/amazing-feature`)
5. **创建** Pull Request

### 📝 贡献指南

- 遵循现有的代码风格
- 添加适当的测试
- 更新相关文档
- 确保所有测试通过

### 🐛 报告问题

请使用 [GitHub Issues](https://github.com/lginxai/luckin/issues) 报告 bug 或提出功能请求。

## 📄 许可证

本项目基于 [MIT 许可证](LICENSE) 开源。

## 🙏 致谢

- **VSCode** - UI 设计灵感
- **shadcn/ui** - 组件设计系统
- **Monaco Editor** - 代码编辑器
- **React** - UI 框架
- **TypeScript** - 类型系统

## 📈 路线图

### 🎯 v3.0 (当前)
- [x] 核心架构重构
- [x] 现代化 UI 组件
- [x] TypeScript 支持
- [x] 插件系统基础

### 🚀 v3.1 (计划中)
- [ ] 语言服务器协议 (LSP) 支持
- [ ] 调试器集成
- [ ] Git 集成
- [ ] 终端集成

### 🌟 v3.2 (未来)
- [ ] 协作编辑
- [ ] 云端同步
- [ ] 移动端支持
- [ ] AI 代码助手

## 📞 联系我们

- **GitHub**: [https://github.com/lginxai/luckin](https://github.com/lginxai/luckin)
- **Issues**: [https://github.com/lginxai/luckin/issues](https://github.com/lginxai/luckin/issues)
- **Discussions**: [https://github.com/lginxai/luckin/discussions](https://github.com/lginxai/luckin/discussions)

---

<div align="center">

**⭐ 如果这个项目对您有帮助，请给我们一个星标！**

Made with ❤️ by the Luckin Team

</div>