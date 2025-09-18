# 设计文档

## 概述

本设计文档详细说明了如何将Luckin IDE的用户界面提升到VSCode级别的专业标准。设计目标是创建一个功能完整、交互流畅的现代化IDE界面，包括活动栏图标多样化、布局系统优化、以及整体用户体验的提升。设计采用现有的Lucide React图标库，并建立完善的CSS布局系统以确保组件间的协调工作。

## 架构

### 组件层次结构 (VSCode风格布局)

```
Workbench (根容器 - 类似VSCode主窗口)
├── MenuBar (顶部菜单栏 - 文件/编辑/查看等)
├── 主内容区域 (flex容器 - VSCode主工作区)
│   ├── ActivityBar (活动栏 - 左侧图标栏，类似VSCode)
│   ├── Sidebar (侧边栏 - 资源管理器/搜索/Git等，可调整大小)
│   ├── 编辑器列 (flex容器 - 中央编辑区域)
│   │   ├── EditorArea (编辑器区域 - 标签页+编辑器内容)
│   │   └── Panel (底部面板 - 终端/输出/问题等，可调整大小)
│   └── AuxiliaryPane (辅助栏 - 右侧面板，可调整大小)
└── StatusBar (底部状态栏 - 分支/错误/语言等信息)
```

### VSCode设计原则

1. **一致性**: 保持与VSCode相似的视觉语言和交互模式
2. **可访问性**: 确保界面元素有足够的点击区域和清晰的视觉反馈
3. **响应性**: 所有调整操作应该流畅且即时响应
4. **专业性**: 界面应该体现现代IDE的专业水准

### 布局策略

1. **Flexbox布局**: 使用CSS Flexbox确保组件正确对齐和响应式调整
2. **固定高度容器**: 确保主容器使用`h-screen`限制总高度
3. **滚动区域隔离**: 仅在需要的组件内部启用滚动
4. **响应式宽度调整**: 确保可调整大小的面板改变宽度时，相邻组件能够正确调整而不是整体移动

## 组件和接口

### ActivityBar组件改进

#### 图标映射策略

创建一个图标映射对象，为每个活动项分配对应的Lucide React图标：

```typescript
interface ActivityIconMap {
  [key: string]: React.ComponentType<any>;
}

const ACTIVITY_ICONS: ActivityIconMap = {
  explorer: FolderOpen,      // 资源管理器
  search: Search,            // 搜索
  git: GitBranch,           // 源代码管理
  debug: Bug,               // 运行和调试
  extensions: Package,       // 扩展
  user: User,               // 用户
  settings: Settings,        // 设置
  test: TestTube,           // 测试
};
```

#### 组件接口更新

```typescript
export interface ActivityBarProps {
  className?: string;
  iconMap?: ActivityIconMap; // 可选的自定义图标映射
}
```

### Workbench布局修复

#### CSS类结构优化

```css
.workbench-root {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 防止整体滚动 */
  position: relative;
}

.menu-bar {
  position: relative;
  z-index: 1000; /* 确保菜单栏在最上层 */
  flex-shrink: 0;
}

.main-content {
  flex: 1;
  display: flex;
  min-height: 0; /* 允许flex子项收缩 */
  position: relative;
  width: 100%; /* 确保主内容区域占满可用宽度 */
}

.resizable-sidebar {
  flex-shrink: 0; /* 侧边栏不收缩，保持设定宽度 */
  position: relative;
}

.editor-column {
  flex: 1; /* 编辑器列占用剩余空间 */
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0; /* 允许编辑器列收缩 */
  position: relative;
  z-index: 1; /* 编辑器层级低于菜单栏 */
}

.resizable-auxiliary {
  flex-shrink: 0; /* 辅助栏不收缩，保持设定宽度 */
  position: relative;
}

.sidebar-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  position: relative;
  z-index: 10;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto; /* 仅在内容区域滚动 */
}

.status-bar {
  position: relative;
  z-index: 1000; /* 确保状态栏在最上层 */
  flex-shrink: 0;
}
```

## 数据模型

### 活动项配置模型

```typescript
interface ActivityItem {
  id: string;
  label: string;
  icon?: string; // 图标标识符
  tooltip?: string;
  order?: number;
}

interface ActivityBarConfig {
  items: ActivityItem[];
  defaultIcon?: string;
}
```

### 布局状态模型

```typescript
interface LayoutDimensions {
  sidebarWidth: number;
  panelHeight: number;
  auxiliaryWidth: number;
}

interface LayoutState {
  dimensions: LayoutDimensions;
  visibility: {
    sidebar: boolean;
    panel: boolean;
    auxiliary: boolean;
    statusBar: boolean;
    menuBar: boolean;
    activityBar: boolean;
  };
}
```

## 错误处理

### 图标加载失败处理

1. **回退机制**: 如果指定图标不存在，使用默认的FileText图标
2. **错误日志**: 在开发模式下记录图标加载失败的警告
3. **类型安全**: 使用TypeScript确保图标引用的正确性

```typescript
const getActivityIcon = (activityId: string): React.ComponentType<any> => {
  const IconComponent = ACTIVITY_ICONS[activityId];
  if (!IconComponent) {
    console.warn(`Icon not found for activity: ${activityId}, using default`);
    return FileText;
  }
  return IconComponent;
};
```

### 布局渲染错误处理

1. **最小尺寸保护**: 确保组件有最小宽度/高度限制
2. **溢出处理**: 正确处理内容溢出情况
3. **响应式降级**: 在小屏幕上优雅降级

### 拖动交互问题处理

1. **拖动手柄可用性**: 确保拖动手柄有足够的点击区域（至少4-6px高度）
2. **事件冲突解决**: 避免拖动事件与其他交互事件冲突
3. **视觉反馈**: 提供清晰的拖动状态视觉反馈
4. **双向拖动**: 确保拖动操作在两个方向都能正常工作

## 测试策略

### 单元测试

1. **图标渲染测试**: 验证每个活动项显示正确的图标
2. **布局计算测试**: 测试不同屏幕尺寸下的布局计算
3. **状态管理测试**: 测试布局状态的正确更新

### 集成测试

1. **组件交互测试**: 测试活动栏点击和侧边栏切换
2. **响应式测试**: 测试窗口大小调整时的布局响应
3. **滚动行为测试**: 验证滚动仅在正确的区域内发生

### 视觉回归测试

1. **截图对比**: 确保UI改进不会破坏现有视觉效果
2. **跨浏览器测试**: 验证在不同浏览器中的一致性
3. **主题兼容性**: 测试在不同主题下的显示效果

## 实现细节

### CSS优化要点

1. **使用CSS Grid或Flexbox**: 确保布局的灵活性和响应性
2. **避免固定高度**: 使用相对单位和flex属性
3. **正确的overflow设置**: 在合适的容器上设置overflow属性
4. **z-index管理**: 确保菜单栏和状态栏始终在最上层显示，建立正确的层级关系

### 性能考虑

1. **图标懒加载**: 考虑对不常用的图标进行懒加载
2. **CSS优化**: 使用CSS变量和高效的选择器
3. **重渲染优化**: 使用React.memo和useMemo减少不必要的重渲染

### 可访问性 (VSCode标准)

1. **键盘导航**: 确保所有活动栏按钮可通过键盘访问，支持Tab导航
2. **屏幕阅读器支持**: 为图标添加适当的aria-label和语义化标签
3. **高对比度支持**: 确保图标在高对比度模式下清晰可见
4. **焦点指示**: 提供清晰的焦点指示器，类似VSCode的焦点样式
5. **快捷键支持**: 支持常用的IDE快捷键操作

## 迁移策略

1. **向后兼容**: 保持现有API的兼容性
2. **渐进式更新**: 可以分阶段实施改进
3. **配置选项**: 提供配置选项以支持自定义图标映射