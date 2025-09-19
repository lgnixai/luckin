## 我们的插件架构（面向 Obsidian 风格的改良版）

- **分层**:
  - **App/前端**: 插件运行在浏览器上下文（JS/TS），仅通过 SDK 访问后端能力。
  - **Plugin Host（Go）**: 统一的能力边界与权限网关；提供 JSON-RPC/HTTP 接口，管理插件清单、权限校验、事件与文件系统。
  - **Vault**: 内容库根目录，由 Host 代理读写。

- **插件形态**:
  - **前端插件（首选）**: 清单 + 前端代码（通过 SDK 远程调用 Host 能力）。
  - **后端插件（可选）**: 将来可支持以独立进程/容器注册的服务插件，通过插件协议与 Host 交互（当前版本先不实现）。

- **清单 manifest.json（v1）**:
  - 基本: id, name, version, minAppVersion, description, author
  - 入口: entrypoints.frontend（URL 或包名），entrypoints.backend（预留）
  - 权限: permissions 字符串数组（详见 permissions.md）

- **权限模型**:
  - 细粒度能力：vault.read, vault.write, network.request, workspace.read, workspace.write, commands.register, views.register, markdown.process 等
  - Host 在每次 RPC 调用按 pluginId 校验权限

- **扩展点（首批）**:
  - Commands: 通过 RPC 注册命令元数据，由前端 UI 呈现
  - Vault FS: 列表/读/写/重命名/删除（受权限约束）
  - Markdown Processor: 前端在渲染阶段触发，必要时向 Host 请求数据
  - Views: 自定义面板的元数据注册（前端负责渲染，Host 仅做状态与权限校验）

- **事件模型**:
  - Host 提供事件源（SSE/WebSocket 预留），v1 先用轮询/拉取
  - 事件类型：vault.fileChanged, command.invoked, workspace.layoutChanged 等

- **安全与隔离**:
  - 前端插件不直接访问原生 FS，仅经 Host RPC
  - 权限白名单 + 最小化接口；将来引入插件代码签名/来源校验

- **版本与兼容**:
  - manifest.minAppVersion 控制兼容
  - Host API 采用语义化版本；/rpc 命名空间可带版本（v1）

- **分发与安装**:
  - 插件包: manifest.json + 前端资源（URL 或本地包）
  - 市场: 维护索引 JSON，Host 可拉取索引并校验清单

- **开发体验**:
  - 提供轻量 JS SDK 封装 RPC
  - CLI（后续）支持校验清单、打包、发布

目录参考：
```
docs/
  architecture.md
  permissions.md
  manifest.schema.json
cmd/
  host/
internal/host/
plugins/
  example/
    manifest.json
sdk/js/
  client.js
vault/
```

