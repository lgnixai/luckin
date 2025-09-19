# 插件系统集成测试指南

## 概述

我们已经成功将插件系统集成到greenserver中，现在可以进行测试。

## 集成内容

### 后端集成 (Greenserver)

1. **插件模块** (`greenserver/app/plugin/`)
   - `model.go` - 数据模型定义
   - `dto.go` - 数据传输对象
   - `repository.go` - 数据访问层
   - `service.go` - 业务逻辑层
   - `handler.go` - HTTP处理器

2. **数据库迁移**
   - 添加了插件相关的数据表
   - 支持插件、权限、命令、安装记录、存储库文件等

3. **路由集成**
   - `/v1/plugins` - 插件管理API
   - `/v1/plugins/rpc` - JSON-RPC接口
   - `/v1/plugins/events` - Server-Sent Events
   - `/v1/plugins/:pluginID/assets/*filepath` - 静态资源服务

### 前端集成

1. **新的API客户端** (`packages/core/src/services/`)
   - `greenserver-plugin-api.ts` - Greenserver API客户端
   - `plugin-service-greenserver.ts` - 基于Greenserver的插件服务

2. **更新的组件**
   - `ExtensionManager` - 使用新的Greenserver API
   - `App.tsx` - 初始化Greenserver插件服务

## 测试步骤

### 1. 启动Greenserver

```bash
cd greenserver
go run cmd/server/main.go
```

服务器将在 `http://localhost:6066` 启动

### 2. 启动前端应用

```bash
cd apps/web
npm run dev
```

前端应用将在 `http://localhost:3000` 启动

### 3. 测试插件API

#### 获取所有插件
```bash
curl http://localhost:6066/v1/plugins
```

#### 测试RPC接口
```bash
curl -X POST http://localhost:6066/v1/plugins/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-1",
    "method": "host.getPlugins",
    "params": {}
  }'
```

#### 测试事件流
```bash
curl -N http://localhost:6066/v1/plugins/events
```

### 4. 测试插件页面

访问测试插件页面：
`http://localhost:6066/v1/plugins/assets/hello-world/index.html`

这个页面包含：
- 命令注册测试
- 命令调用测试
- 存储库文件列表测试
- 实时事件监听

### 5. 测试前端插件管理器

在前端应用中：
1. 打开扩展管理器
2. 查看已安装的插件
3. 测试启用/禁用功能
4. 测试安装/卸载功能

## API端点

### REST API

- `GET /v1/plugins` - 获取所有插件
- `GET /v1/plugins/{id}` - 获取单个插件
- `POST /v1/plugins/install` - 安装插件
- `DELETE /v1/plugins/{id}` - 卸载插件
- `POST /v1/plugins/enable` - 启用插件
- `POST /v1/plugins/disable` - 禁用插件
- `POST /v1/plugins/backup` - 备份插件
- `GET /v1/plugins/market` - 获取市场插件
- `GET /v1/plugins/commands` - 获取所有命令
- `GET /v1/plugins/{id}/installation-status` - 获取安装状态

### JSON-RPC API

通过 `POST /v1/plugins/rpc` 支持以下方法：

- `host.getPlugins` - 获取插件列表
- `vault.list` - 列出存储库文件
- `vault.read` - 读取存储库文件
- `vault.write` - 写入存储库文件
- `commands.register` - 注册命令
- `commands.list` - 列出命令
- `commands.invoke` - 调用命令
- `host.enablePlugin` - 启用插件
- `host.disablePlugin` - 禁用插件
- `host.backupPlugin` - 备份插件
- `host.getInstallationStatus` - 获取安装状态

### Server-Sent Events

通过 `GET /v1/plugins/events` 接收实时事件：

- `plugin.enabled` - 插件已启用
- `plugin.disabled` - 插件已禁用
- `plugin.installed` - 插件已安装
- `plugin.uninstalled` - 插件已卸载
- `plugin.installation.progress` - 安装进度
- `command.invoked` - 命令已调用

## 配置插件系统

插件系统已集成到greenserver的配置系统中，可以通过以下方式配置：

### 环境变量配置

创建 `.env` 文件或设置以下环境变量：

```bash
# 插件系统配置
PLUGINS_DIR=./plugins                # 插件目录路径
VAULT_DIR=./vault                   # 存储库目录路径  
PLUGIN_MARKET_URL=                  # 插件市场URL (可选)
PLUGIN_ENABLED=true                 # 是否启用插件系统
PLUGIN_MAX_FILE_SIZE=10485760       # 最大文件大小 (10MB)
```

### YAML配置文件

插件配置也已添加到 `config/config.yaml` 文件中：

```yaml
# 插件系统配置
plugin:
  plugins_dir: ./plugins           # 插件目录路径
  vault_dir: ./vault              # 存储库目录路径
  market_url: ""                  # 插件市场URL (可选)
  enabled: true                   # 是否启用插件系统
  max_file_size: 10485760         # 最大文件大小 (10MB)
  allowed_permissions:            # 允许的权限列表
    - vault.read
    - vault.write
    - commands.register
    - commands.invoke
    - ui.show
    - notifications.send
```

### 配置说明

- **plugins_dir**: 插件文件存储目录
- **vault_dir**: 用户文件存储目录（插件可访问）
- **market_url**: 插件市场API地址（用于下载插件）
- **enabled**: 是否启用插件系统（false时将跳过插件初始化）
- **max_file_size**: 单个文件最大大小限制
- **allowed_permissions**: 系统允许的权限列表

## 故障排除

### 常见问题

1. **插件未加载**
   - 检查插件目录是否存在
   - 确认 `manifest.json` 格式正确
   - 查看服务器日志

2. **权限错误**
   - 确认插件具有所需权限
   - 检查数据库中的权限记录

3. **API调用失败**
   - 检查网络连接
   - 确认API端点正确
   - 查看浏览器开发者工具

### 日志位置

- 服务器日志: 控制台输出
- 前端日志: 浏览器开发者工具
- 插件日志: 插件页面的输出区域

## 下一步

1. 添加更多插件示例
2. 实现插件市场功能
3. 添加插件权限管理界面
4. 实现插件依赖管理
5. 添加插件开发工具

## 成功标志

如果看到以下情况，说明集成成功：

1. Greenserver启动时显示 "Loaded X plugins from disk"
2. 前端能够连接到插件服务
3. 测试插件页面能够正常工作
4. ExtensionManager显示已安装的插件
5. 实时事件正常接收

恭喜！插件系统已成功集成到Greenserver中！
