# Hello World Plugin

一个简单的 Hello World 扩展，用于演示 Luckin IDE 插件系统的基本功能。

## 功能特性

### 🎯 核心功能
- **活动栏集成**: 在活动栏中显示 👋 图标
- **侧边栏界面**: 提供丰富的交互式用户界面
- **命令系统**: 注册多个可通过命令面板调用的命令
- **通知系统**: 展示各种类型的通知消息
- **本地存储**: 保存和加载插件设置

### 🎨 界面特性
- **响应式设计**: 适配不同屏幕尺寸
- **主题自适应**: 自动适配 VS Code 主题
- **实时日志**: 显示插件操作日志
- **设置面板**: 可配置的插件选项

## 插件结构

```
hello-world/
├── manifest.json    # 插件清单文件
├── index.html      # 前端界面
└── README.md       # 说明文档
```

## 清单文件说明

插件通过 `manifest.json` 定义其元数据和贡献点：

- **活动栏**: 贡献一个带有 👋 图标的活动栏项目
- **命令**: 注册三个命令供用户调用
- **权限**: 请求通知、存储和命令权限

## 使用方法

1. **安装插件**: 通过插件市场安装或手动放置到 plugins 目录
2. **激活插件**: 点击活动栏中的 👋 图标
3. **交互体验**: 
   - 点击各种按钮体验功能
   - 使用命令面板执行插件命令
   - 配置插件设置

## 命令列表

| 命令ID | 标题 | 描述 |
|--------|------|------|
| `hello-world.sayHello` | Say Hello | 显示问候消息 |
| `hello-world.showInfo` | Show Plugin Info | 显示插件信息 |
| `hello-world.openSettings` | Open Settings | 打开设置面板 |

## 开发说明

这个插件展示了以下开发模式：

### 1. 插件清单 (manifest.json)
定义插件的基本信息、贡献点和权限需求。

### 2. 前端界面 (index.html)
- 使用标准的 HTML/CSS/JavaScript
- 通过 CSS 变量适配 VS Code 主题
- 使用 `window.luckinAPI` 与宿主通信

### 3. 宿主通信
- 监听 `message` 事件接收命令
- 使用 `window.luckinAPI` 调用宿主功能
- 支持通知、存储等 API

## API 使用示例

### 显示通知
```javascript
window.luckinAPI.showNotification({
    type: 'info',
    title: 'Hello World',
    message: '这是一个通知消息'
});
```

### 存储数据
```javascript
// 保存数据
window.luckinAPI.storage.set('key', value);

// 读取数据
const value = window.luckinAPI.storage.get('key');
```

### 执行命令
```javascript
window.luckinAPI.executeCommand('hello-world.sayHello');
```

## 扩展建议

基于这个示例，你可以：

1. **添加更多命令**: 在 manifest.json 中定义新命令
2. **集成编辑器**: 与编辑器内容进行交互
3. **文件操作**: 读写工作区文件
4. **网络请求**: 与外部服务通信
5. **状态管理**: 实现复杂的状态逻辑

## 许可证

MIT License - 可自由使用、修改和分发。
