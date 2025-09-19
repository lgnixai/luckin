## 权限列表（v1 提案）

- vault.read: 列出与读取 Vault 文件
- vault.write: 创建/修改/删除 Vault 文件
- commands.register: 注册命令
- views.register: 注册自定义视图元数据
- markdown.process: 参与 Markdown 渲染处理
- workspace.read: 读取工作区状态（预留）
- workspace.write: 修改工作区布局（预留）
- network.request: 发起网络请求（预留，由前端执行）

说明：
- Host 将在每次 /rpc 调用中根据 pluginId 校验权限
- 后续可增加作用域与路径级细化（如 vault.read:/notes/**）

