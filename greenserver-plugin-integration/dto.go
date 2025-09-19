package plugin

import "time"

// PluginResponse 插件响应
type PluginResponse struct {
	ID          uint                 `json:"id"`
	PluginID    string               `json:"plugin_id"`
	Name        string               `json:"name"`
	Version     string               `json:"version"`
	Author      string               `json:"author"`
	Description string               `json:"description"`
	Enabled     bool                 `json:"enabled"`
	BackupPath  string               `json:"backup_path"`
	Entrypoints *EntrypointsResponse `json:"entrypoints,omitempty"`
	Permissions []string             `json:"permissions"`
	Commands    []CommandResponse    `json:"commands"`
	CreatedAt   time.Time            `json:"created_at"`
	UpdatedAt   time.Time            `json:"updated_at"`
}

// EntrypointsResponse 插件入口点响应
type EntrypointsResponse struct {
	Frontend string `json:"frontend,omitempty"`
	Backend  string `json:"backend,omitempty"`
}

// CommandResponse 命令响应
type CommandResponse struct {
	ID          uint   `json:"id"`
	CommandID   string `json:"command_id"`
	PluginID    string `json:"plugin_id"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

// PluginInstallRequest 插件安装请求
type PluginInstallRequest struct {
	ID     string `json:"id" binding:"required"`  // 插件ID
	URL    string `json:"url" binding:"required"` // 下载URL
	SHA256 string `json:"sha256"`                 // 文件校验和（可选）
}

// PluginToggleRequest 插件启用/禁用请求
type PluginToggleRequest struct {
	PluginID string `json:"plugin_id" binding:"required"`
}

// PluginBackupRequest 插件备份请求
type PluginBackupRequest struct {
	PluginID string `json:"plugin_id" binding:"required"`
}

// CommandRegisterRequest 命令注册请求
type CommandRegisterRequest struct {
	ID    string `json:"id" binding:"required"`
	Title string `json:"title" binding:"required"`
}

// CommandInvokeRequest 命令调用请求
type CommandInvokeRequest struct {
	ID string `json:"id" binding:"required"`
}

// VaultListResponse 存储库文件列表响应
type VaultListResponse struct {
	Files []string `json:"files"`
}

// VaultReadRequest 存储库文件读取请求
type VaultReadRequest struct {
	Path string `json:"path" binding:"required"`
}

// VaultReadResponse 存储库文件读取响应
type VaultReadResponse struct {
	Path    string `json:"path"`
	Content string `json:"content"`
}

// VaultWriteRequest 存储库文件写入请求
type VaultWriteRequest struct {
	Path    string `json:"path" binding:"required"`
	Content string `json:"content" binding:"required"`
}

// VaultWriteResponse 存储库文件写入响应
type VaultWriteResponse struct {
	Ok bool `json:"ok"`
}

// RPCRequest JSON-RPC请求结构
type RPCRequest struct {
	ID       string      `json:"id,omitempty"`
	Method   string      `json:"method" binding:"required"`
	Params   interface{} `json:"params,omitempty"`
	PluginID string      `json:"pluginId,omitempty"`
}

// RPCResponse JSON-RPC响应结构
type RPCResponse struct {
	ID     string      `json:"id,omitempty"`
	Result interface{} `json:"result,omitempty"`
	Error  *RPCError   `json:"error,omitempty"`
}

// RPCError JSON-RPC错误结构
type RPCError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// InstallationStatusResponse 安装状态响应
type InstallationStatusResponse struct {
	PluginID    string     `json:"plugin_id"`
	Status      string     `json:"status"`
	Progress    int        `json:"progress"`
	Message     string     `json:"message"`
	InstalledAt *time.Time `json:"installed_at"`
}

// MarketItem 市场插件项目
type MarketItem struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Version     string  `json:"version"`
	Author      string  `json:"author"`
	Description string  `json:"description"`
	URL         string  `json:"url"`
	SHA256      string  `json:"sha256"`
	Downloads   int     `json:"downloads"`
	Rating      float64 `json:"rating"`
}

// EventData 事件数据
type EventData struct {
	Type string                 `json:"type"`
	Data map[string]interface{} `json:"data"`
}
