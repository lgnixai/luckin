## Obsidian 插件模型要点（精要版）

- **运行环境**: Electron 应用，前端为浏览器环境，带 Node 能力。社区插件以 JS/TS 形式运行在同一渲染进程上下文，非强隔离，信任模型+最小 API 暴露。
- **清单 manifest.json**: id, name, version, minAppVersion, description, author, authorUrl, isDesktopOnly 等；用于市场索引、兼容性、加载控制。
- **核心扩展点**:
  - **Commands**: 命令面板动作，快捷键绑定；插件可注册命令并与 UI 交互。
  - **Views & Panes**: 侧栏面板与自定义视图；支持 split/attach/detach。
  - **Ribbon/Menu**: 左侧工具栏按钮、右键菜单扩展。
  - **Markdown**: 渲染钩子（post processor）、自定义语法/容器、代码块处理（如 ```mermaid）。
  - **File/Vault API**: TFile/Folder 抽象，文件系统事件（create/change/delete/rename）。
  - **Workspace/Events**: 全局事件总线，订阅/广播。
  - **Settings**: 插件自身配置面板与持久化。
  - **Network/HTTP**: 依赖 Node fetch/库；社区插件常自带后端交互。
- **分发**: GitHub Release 上传 zip（manifest.json, main.js, styles.css）；由社区市场索引与审核（轻审核）。
- **安全**: 无强沙箱；启用插件前有警告。插件可潜在读写库文件、发网络请求。
- **版本与兼容**: 通过 minAppVersion 控制；核心 API 有语义化版本但无严格隔离。

以上机制的优势是开发体验极佳、生态繁荣；缺点是安全与权限控制较弱。我们可在此基础上引入更明确的权限模型与 RPC 边界，将文件系统与敏感操作下沉到独立 Host（Go）侧，以 JSON-RPC/HTTP 暴露能力。

