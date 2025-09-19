## 前端如何执行与显示插件

### 安装位置
- Host 维护本地插件目录：`<HOST_PLUGINS_DIR>/<pluginId>/`，保存 `manifest.json` 与前端资源（如 `index.js`, `styles.css`, 静态文件）。
- 通过市场安装时，Host 下载插件包，校验后解压到上述目录。

### 前端加载
- Host 暴露静态路由：
  - `/plugins/` 指向 `<HOST_PLUGINS_DIR>`
  - `/sdk/` 指向 SDK（前端通过 `/sdk/js/client.js` 获取 Host 调用能力）

### 执行流程
1. 前端页面启动时，调用 `host.getPlugins` 拉取已安装插件列表（含 entrypoints）。
2. 对于带有 `entrypoints.frontend` 的插件：
   - 若是相对路径（如 `index.js`），可拼为 `/plugins/<pluginId>/index.js` 动态导入
   - 若是远程 URL，可直接动态导入或以 `<script type="module">` 加载
3. 插件前端拿到 `pluginId` 后，创建 `HostClient({ baseUrl, pluginId })` 与 Host 通信。

### 显示位置
- Core UI 提供容器区域（侧栏、面板、弹出区）；插件通过命令或视图注册 API 将自身 UI 挂载到容器（v1 示例为命令事件）。
- 简化模式：插件页面自身负责渲染（如 `frontend-demo.html`），通过 SDK 与 Host 交互。

### 市场与安装
1. 前端展示市场列表（来自市场 `index.json`）。
2. 用户点击安装 -> 调用 Host 的安装接口（后续提供），Host 下载并落地到 `<HOST_PLUGINS_DIR>/<pluginId>/`。
3. 安装后 `host.getPlugins` 即可看到；前端刷新或动态加载其 entrypoint。

### 示例
- 访问 `/plugins/example/frontend-demo.html`，演示读写 Vault、注册命令与事件监听。

