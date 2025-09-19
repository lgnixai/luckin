package plugin

import (
	"time"

	"gorm.io/gorm"
)

// Plugin 插件模型
type Plugin struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	PluginID    string         `json:"plugin_id" gorm:"uniqueIndex;not null"`                   // 插件唯一标识
	Name        string         `json:"name" gorm:"not null"`                                    // 插件名称
	Version     string         `json:"version" gorm:"not null"`                                 // 插件版本
	Author      string         `json:"author"`                                                  // 插件作者
	Description string         `json:"description"`                                             // 插件描述
	Enabled     bool           `json:"enabled" gorm:"default:true"`                             // 是否启用
	BackupPath  string         `json:"backup_path"`                                             // 备份路径
	Permissions []Permission   `json:"permissions" gorm:"many2many:plugin_permissions;"`        // 插件权限
	Commands    []Command      `json:"commands" gorm:"foreignKey:PluginID;references:PluginID"` // 插件命令
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// Permission 权限模型
type Permission struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"uniqueIndex;not null"` // 权限名称，如 "vault.read", "vault.write"
	Description string         `json:"description"`                      // 权限描述
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// Command 命令模型
type Command struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	CommandID   string         `json:"command_id" gorm:"not null"` // 命令标识
	PluginID    string         `json:"plugin_id" gorm:"not null"`  // 所属插件ID
	Title       string         `json:"title" gorm:"not null"`      // 命令标题
	Description string         `json:"description"`                // 命令描述
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// PluginInstallation 插件安装记录
type PluginInstallation struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	PluginID    string         `json:"plugin_id" gorm:"not null"`       // 插件ID
	Status      string         `json:"status" gorm:"default:'pending'"` // 安装状态：pending, installing, installed, failed
	Progress    int            `json:"progress" gorm:"default:0"`       // 安装进度 0-100
	Message     string         `json:"message"`                         // 状态消息
	SourceURL   string         `json:"source_url"`                      // 安装源URL
	SHA256      string         `json:"sha256"`                          // 文件校验和
	InstalledAt *time.Time     `json:"installed_at"`                    // 安装完成时间
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// VaultFile 存储库文件模型（用于插件访问用户文件）
type VaultFile struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Path      string         `json:"path" gorm:"uniqueIndex;not null"` // 文件相对路径
	Content   []byte         `json:"content"`                          // 文件内容
	MimeType  string         `json:"mime_type"`                        // 文件类型
	Size      int64          `json:"size"`                             // 文件大小
	UserID    uint           `json:"user_id" gorm:"not null"`          // 所属用户ID
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// TableName 设置表名
func (Plugin) TableName() string {
	return "plugins"
}

func (Permission) TableName() string {
	return "permissions"
}

func (Command) TableName() string {
	return "commands"
}

func (PluginInstallation) TableName() string {
	return "plugin_installations"
}

func (VaultFile) TableName() string {
	return "vault_files"
}
