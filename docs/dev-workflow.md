## 开发者工作流（v1）

1. 创建插件目录 `plugins/<your.plugin.id>/` 并编写 `manifest.json`
2. 前端代码使用 `sdk/js/client.js` 调用 Host 能力
3. 启动 Host：
   - `HOST_PLUGINS_DIR=/workspace/plugins HOST_VAULT_DIR=/workspace/vault go run ./cmd/host`
4. 在开发页面（或你的前端应用）中加载插件前端资源并传入 `pluginId`
5. 通过 RPC 注册命令、读写文件，并监听 `/events` 获取事件

未来 CLI:
- `plugin validate` 校验 `manifest.json` 与权限
- `plugin pack` 打包并生成 sha256
- `plugin publish` 发布到市场

