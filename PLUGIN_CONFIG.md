# 插件系统配置说明

## 概述

插件系统已成功集成到greenserver中，支持通过环境变量和YAML配置文件进行配置。

## 配置方式

### 1. 环境变量配置

创建 `.env` 文件并设置以下变量：

```bash
# 插件系统配置
PLUGINS_DIR=./plugins                # 插件目录路径
VAULT_DIR=./vault                   # 存储库目录路径  
PLUGIN_MARKET_URL=                  # 插件市场URL (可选)
PLUGIN_ENABLED=true                 # 是否启用插件系统
PLUGIN_MAX_FILE_SIZE=10485760       # 最大文件大小 (10MB)
```

### 2. YAML配置文件

插件配置已添加到 `config/config.yaml` 文件中：

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

## 配置参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `plugins_dir` | string | `./plugins` | 插件文件存储目录 |
| `vault_dir` | string | `./vault` | 用户文件存储目录（插件可访问） |
| `market_url` | string | `""` | 插件市场API地址（用于下载插件） |
| `enabled` | bool | `true` | 是否启用插件系统 |
| `max_file_size` | int64 | `10485760` | 单个文件最大大小限制（字节） |
| `allowed_permissions` | []string | 见下方 | 系统允许的权限列表 |

## 默认权限列表

```go
[]string{
    "vault.read",           // 读取用户文件
    "vault.write",          // 写入用户文件
    "commands.register",    // 注册命令
    "commands.invoke",      // 调用命令
    "ui.show",             // 显示UI界面
    "notifications.send",   // 发送通知
}
```

## 目录结构

启动服务器时，系统会自动创建以下目录结构：

```
greenserver/
├── plugins/              # 插件目录
│   └── hello-world/      # 示例插件
│       ├── manifest.json
│       └── index.html
├── vault/               # 用户文件存储目录
└── backups/             # 插件备份目录（自动创建）
```

## 使用示例

### 启用插件系统（默认）

```bash
PLUGIN_ENABLED=true
```

### 禁用插件系统

```bash
PLUGIN_ENABLED=false
```

### 自定义插件目录

```bash
PLUGINS_DIR=/path/to/custom/plugins
VAULT_DIR=/path/to/custom/vault
```

### 设置插件市场

```bash
PLUGIN_MARKET_URL=https://your-plugin-market.com/api
```

### 限制文件大小（5MB）

```bash
PLUGIN_MAX_FILE_SIZE=5242880
```

## 注意事项

1. **目录权限**: 确保服务器进程对 `plugins_dir` 和 `vault_dir` 有读写权限
2. **文件大小**: `max_file_size` 限制单个文件的大小，防止过大文件影响性能
3. **安全性**: `allowed_permissions` 控制插件可以使用的权限，建议根据需要调整
4. **市场URL**: 如果不设置 `market_url`，插件市场功能将不可用
5. **禁用插件**: 设置 `enabled=false` 可以完全禁用插件系统，提高启动速度

## 配置优先级

配置加载优先级（高到低）：

1. 环境变量
2. `.env` 文件
3. YAML配置文件
4. 默认值

## 验证配置

启动服务器后，查看日志输出：

- 插件系统启用: `"Loaded X plugins from disk"`
- 插件系统禁用: `"Plugin system is disabled"`
- 配置错误: `"Warning: Failed to load config for plugin system"`

## 故障排除

### 插件未加载

1. 检查 `PLUGIN_ENABLED` 是否为 `true`
2. 确认插件目录存在且有正确权限
3. 检查插件的 `manifest.json` 格式是否正确

### 权限错误

1. 检查插件请求的权限是否在 `allowed_permissions` 列表中
2. 确认插件 `manifest.json` 中声明了所需权限

### 文件大小限制

1. 检查上传的文件是否超过 `max_file_size` 限制
2. 根据需要调整文件大小限制
