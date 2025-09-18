# 设计文档 - Obsidian风格编辑器

## 概述

设计一个基于 Obsidian 风格的现代化编辑器系统，支持多标签页管理、灵活的分栏布局和丰富的交互功能。该编辑器将替换当前的 Monaco 编辑器实现，提供更直观的多文档工作流程。

## 架构

### 核心组件架构

```
ObsidianEditor (主容器)
├── EditorHeader (顶部工具栏)
├── PaneContainer (分栏容器)
│   ├── EditorPane (编辑器面板)
│   │   ├── TabBar (标签栏)
│   │   │   ├── Tab (标签页)
│   │   │   │   ├── TabTitle (标签标题)
│   │   │   │   ├── TabDropdown (下拉菜单)
│   │   │   │   └── TabCloseButton (关闭按钮)
│   │   │   └── NewTabButton (新建标签按钮)
│   │   └── TabContent (标签内容区)
│   │       ├── FileEditor (文件编辑器)
│   │       └── EmptyState (空状态页面)
│   └── PaneSplitter (分栏分隔器)
└── QuickActions (快捷操作面板)
```

### 状态管理架构

```typescript
interface EditorState {
  panes: EditorPane[];
  activePane: string;
  layout: 'single' | 'horizontal' | 'vertical' | 'grid';
  tabs: Record<string, Tab>;
  recentFiles: string[];
  settings: EditorSettings;
}

interface EditorPane {
  id: string;
  tabs: string[];
  activeTab: string;
  position: PanePosition;
  size: number;
}

interface Tab {
  id: string;
  title: string;
  filePath?: string;
  content: string;
  isDirty: boolean;
  isLocked: boolean;
  type: 'file' | 'welcome' | 'settings';
}
```

## 组件和接口

### 1. ObsidianEditor (主编辑器组件)

**职责：**
- 管理整体编辑器状态
- 协调各个子组件
- 处理全局快捷键
- 管理分栏布局

**接口：**
```typescript
interface ObsidianEditorProps {
  className?: string;
  initialFiles?: string[];
  onFileChange?: (filePath: string, content: string) => void;
  onTabClose?: (tabId: string) => void;
}
```

### 2. EditorPane (编辑器面板)

**职责：**
- 管理单个面板的标签页
- 处理标签页切换
- 管理面板内的文件编辑

**接口：**
```typescript
interface EditorPaneProps {
  pane: EditorPane;
  tabs: Tab[];
  onTabSwitch: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabMove: (tabId: string, targetPane: string) => void;
  onSplit: (direction: 'horizontal' | 'vertical') => void;
}
```

### 3. TabBar (标签栏)

**职责：**
- 显示和管理标签页
- 处理标签页拖拽
- 提供标签页操作菜单

**接口：**
```typescript
interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabDrag: (tabId: string, position: DragPosition) => void;
  onNewTab: () => void;
}
```

### 4. Tab (标签页)

**职责：**
- 显示单个标签页
- 处理标签页交互
- 提供下拉菜单功能

**接口：**
```typescript
interface TabProps {
  tab: Tab;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
  onMenuAction: (action: TabAction) => void;
  draggable?: boolean;
}

type TabAction = 
  | 'close'
  | 'closeOthers'
  | 'closeAll'
  | 'lock'
  | 'unlock'
  | 'moveToNewWindow'
  | 'splitHorizontal'
  | 'splitVertical';
```

### 5. FileEditor (文件编辑器)

**职责：**
- 渲染文件内容
- 处理文件编辑
- 支持不同文件类型

**接口：**
```typescript
interface FileEditorProps {
  tab: Tab;
  onContentChange: (content: string) => void;
  readOnly?: boolean;
}
```

### 6. QuickActions (快捷操作面板)

**职责：**
- 显示空状态时的快捷操作
- 提供文件创建和打开功能

**接口：**
```typescript
interface QuickActionsProps {
  onNewFile: () => void;
  onOpenFile: () => void;
  onOpenRecent: (filePath: string) => void;
  recentFiles: string[];
}
```

## 数据模型

### Tab 数据模型

```typescript
interface Tab {
  id: string;
  title: string;
  filePath?: string;
  content: string;
  isDirty: boolean;
  isLocked: boolean;
  type: 'file' | 'welcome' | 'settings';
  language?: string;
  encoding?: string;
  lineEnding?: 'LF' | 'CRLF';
  createdAt: Date;
  modifiedAt: Date;
}
```

### EditorPane 数据模型

```typescript
interface EditorPane {
  id: string;
  tabs: string[];
  activeTab: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  splitDirection?: 'horizontal' | 'vertical';
  parentPane?: string;
  childPanes?: string[];
}
```

### Layout 数据模型

```typescript
interface EditorLayout {
  type: 'single' | 'split';
  panes: EditorPane[];
  splitters: PaneSplitter[];
  activePane: string;
}

interface PaneSplitter {
  id: string;
  direction: 'horizontal' | 'vertical';
  position: number; // 0-1 之间的比例
  paneA: string;
  paneB: string;
}
```

## 错误处理

### 文件操作错误

```typescript
interface FileError {
  type: 'read' | 'write' | 'permission' | 'notFound';
  message: string;
  filePath: string;
}
```

**错误处理策略：**
1. 文件读取失败：显示错误消息，提供重试选项
2. 文件保存失败：显示警告，保留未保存状态
3. 权限错误：提示用户检查文件权限
4. 文件不存在：提供创建新文件选项

### 状态恢复错误

```typescript
interface StateError {
  type: 'corruption' | 'version' | 'storage';
  message: string;
  recoverable: boolean;
}
```

**恢复策略：**
1. 状态损坏：重置为默认状态，保留文件内容
2. 版本不兼容：尝试迁移，失败则重置
3. 存储错误：使用内存状态，提示用户

## 测试策略

### 单元测试

1. **组件测试**
   - Tab 组件的渲染和交互
   - TabBar 的标签页管理
   - EditorPane 的状态管理
   - 拖拽功能的逻辑测试

2. **状态管理测试**
   - 标签页的创建、切换、关闭
   - 分栏的创建、调整、合并
   - 文件内容的保存和恢复

3. **工具函数测试**
   - 文件路径处理
   - 内容序列化/反序列化
   - 快捷键处理

### 集成测试

1. **用户工作流测试**
   - 打开多个文件
   - 创建分栏布局
   - 拖拽标签页
   - 保存和恢复会话

2. **性能测试**
   - 大量标签页的性能
   - 大文件的编辑性能
   - 内存使用情况

3. **兼容性测试**
   - 不同浏览器的兼容性
   - 响应式布局测试
   - 键盘导航测试

### E2E 测试

1. **完整用户场景**
   - 从空白状态到多文件编辑
   - 复杂分栏布局的创建和使用
   - 会话恢复功能

2. **边界情况测试**
   - 极大数量的标签页
   - 深层嵌套的分栏
   - 异常情况的恢复

## 性能优化

### 虚拟化

1. **标签页虚拟化**
   - 大量标签页时只渲染可见部分
   - 延迟加载标签页内容

2. **内容虚拟化**
   - 大文件的分块加载
   - 可视区域外的内容延迟渲染

### 内存管理

1. **内容缓存**
   - LRU 缓存策略
   - 自动清理未使用的标签页内容

2. **状态优化**
   - 使用 Immer 进行不可变状态更新
   - 避免不必要的重新渲染

### 渲染优化

1. **React 优化**
   - 使用 React.memo 和 useMemo
   - 合理的组件拆分
   - 避免匿名函数和对象

2. **CSS 优化**
   - 使用 CSS-in-JS 的性能最佳实践
   - 避免复杂的 CSS 选择器
   - 使用 transform 而非 position 进行动画

## 可访问性

### 键盘导航

1. **标签页导航**
   - Tab 键在标签页间切换
   - 方向键在标签页内导航
   - Enter 键激活标签页

2. **快捷键支持**
   - Ctrl+T: 新建标签页
   - Ctrl+W: 关闭标签页
   - Ctrl+Tab: 切换标签页
   - Ctrl+Shift+T: 恢复关闭的标签页

### 屏幕阅读器支持

1. **ARIA 标签**
   - 为所有交互元素添加适当的 ARIA 标签
   - 使用 role 属性标识组件类型

2. **语义化 HTML**
   - 使用语义化的 HTML 元素
   - 提供清晰的标题层次结构

### 视觉辅助

1. **高对比度支持**
   - 支持系统高对比度模式
   - 提供自定义主题选项

2. **字体大小调整**
   - 支持浏览器字体大小设置
   - 提供编辑器字体大小调整

## 国际化

### 多语言支持

1. **界面文本**
   - 所有用户界面文本支持多语言
   - 使用 i18n 库进行文本管理

2. **文件编码**
   - 支持多种文件编码格式
   - 自动检测文件编码

### 本地化

1. **日期时间格式**
   - 根据用户区域设置显示日期时间
   - 支持不同的时间格式

2. **文件路径处理**
   - 正确处理不同操作系统的路径格式
   - 支持 Unicode 文件名