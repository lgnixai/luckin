## 扩展点（v1）

- **Commands**
  - 注册: RPC `commands.register` {id, title}
  - 列表: RPC `commands.list`
  - 触发: RPC `commands.invoke` {id}（当前仅广播事件）
  - 事件: SSE `command.invoked`

- **Vault FS**
  - 列表: RPC `vault.list`
  - 读取: RPC `vault.read` {path}
  - 写入: RPC `vault.write` {path, content}

- **Events**
  - SSE: GET `/events` 持续推送事件

未来：Views、Markdown、Workspace、Network 等将逐步加入。

